import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invoiceNumber,
      customerId,
      totalAmount,
      paidAmount,
      discount,
      tax = 0,
      paymentMethod,
      notes,
      items
    } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'المنتجات مطلوبة' },
        { status: 400 }
      )
    }

    // Generate invoice number based on database count
    const invoiceCount = await prisma.sale.count()
    const generatedInvoiceNumber = invoiceNumber || String(invoiceCount + 1)

    // Check if generated invoice number already exists (safety check)
    const existingSale = await prisma.sale.findUnique({
      where: { invoiceNumber: generatedInvoiceNumber }
    })

    if (existingSale) {
      // If exists, generate a new one with timestamp
      const timestamp = Date.now()
      const finalInvoiceNumber = String(timestamp)
      
      // Double check this one doesn't exist
      const existingSale2 = await prisma.sale.findUnique({
        where: { invoiceNumber: finalInvoiceNumber }
      })
      
      if (existingSale2) {
        return NextResponse.json(
          { error: 'خطأ في توليد رقم الفاتورة' },
          { status: 500 }
        )
      }
      
      // Use the timestamp-based number
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          customerId: customerId || null,
          totalAmount,
          paidAmount: paidAmount || 0,
          discount: discount || 0,
          tax,
          paymentMethod: paymentMethod || 'نقدا',
          notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              total: item.total
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true
        }
      })

      // Update product stock
      for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Update customer balance if customer exists
      if (customerId) {
        const remainingAmount = totalAmount - (paidAmount || 0)
        if (remainingAmount > 0) {
          await prisma.customer.update({
            where: { id: customerId },
            data: {
              balance: {
                increment: remainingAmount
              }
            }
          })
        }
      }

      // Create cashbox transaction for income
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: paidAmount || 0,
          description: `فاتورة مبيعات ${finalInvoiceNumber}`,
          reference: sale.id,
          paymentMethod: paymentMethod || 'نقدا'
        }
      })

      return NextResponse.json({
        success: true,
        sale,
        message: 'تم حفظ الفاتورة بنجاح'
      })
    }

    // Create the sale with items (normal case)
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: generatedInvoiceNumber,
        customerId: customerId || null,
        totalAmount,
        paidAmount: paidAmount || 0,
        discount: discount || 0,
        tax,
        paymentMethod: paymentMethod || 'CASH',
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.total
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    })

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Update customer balance if customer exists
    if (customerId) {
      const remainingAmount = totalAmount - (paidAmount || 0)
      if (remainingAmount > 0) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            increment: remainingAmount
          }
        }
      })
      }
    }

    // Create cashbox transaction for income
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
        amount: paidAmount || 0,
        description: `فاتورة مبيعات ${generatedInvoiceNumber}`,
          reference: sale.id,
        paymentMethod: paymentMethod || 'CASH'
        }
      })

    return NextResponse.json({
      success: true,
      sale,
      message: 'تم حفظ الفاتورة بنجاح'
    })

  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الفاتورة' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const invoiceNumber = searchParams.get('invoiceNumber')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (customerId) {
      where.customerId = customerId
    }

    if (invoiceNumber) {
      where.invoiceNumber = invoiceNumber
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
      include: {
              product: true
            }
          },
          customer: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ])

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المبيعات' },
      { status: 500 }
    )
  }
}