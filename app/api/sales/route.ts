import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Normalize incoming payment method values (Arabic/English/variants) to Prisma enum
function normalizePaymentMethod(input: any): 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_PAYMENT' | 'CASHBOX' {
  const raw = String(input || '').trim().toLowerCase()
  // Arabic and English aliases
  const aliases: Record<string, 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_PAYMENT' | 'CASHBOX'> = {
    // cash
    'cash': 'CASH',
    'نقد': 'CASH',
    'نقدا': 'CASH',
    'كاش': 'CASH',
    // card
    'card': 'CARD',
    'بطاقة': 'CARD',
    'credit_card': 'CARD',
    'credit': 'CARD',
    // bank transfer
    'bank_transfer': 'BANK_TRANSFER',
    'bank transfer': 'BANK_TRANSFER',
    'حوالة': 'BANK_TRANSFER',
    'تحويل بنكي': 'BANK_TRANSFER',
    // check
    'check': 'CHECK',
    'شيك': 'CHECK',
    // mobile payment
    'mobile_payment': 'MOBILE_PAYMENT',
    'mobile payment': 'MOBILE_PAYMENT',
    'mobile': 'MOBILE_PAYMENT',
    'wallet': 'MOBILE_PAYMENT',
    'محفظة': 'MOBILE_PAYMENT',
    // cashbox internal
    'cashbox': 'CASHBOX',
    'صندوق': 'CASHBOX',
  }

  // Direct enum pass-through if caller sends valid enum
  const upper = String(input || '').trim().toUpperCase()
  if (['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'MOBILE_PAYMENT', 'CASHBOX'].includes(upper)) {
    return upper as any
  }

  return aliases[raw] || 'CASH'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

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
      items,
      isDeliveryNote
    } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'المنتجات مطلوبة' },
        { status: 400 }
      )
    }

    // Validate stock availability for all items unless delivery note (no stock decrement)
    if (!isDeliveryNote) {
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        
        if (!product) {
          return NextResponse.json(
            { error: `المنتج غير موجود: ${item.productId}` },
            { status: 400 }
          )
        }
        
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `الكمية المطلوبة (${item.quantity}) تتجاوز المخزون المتاح (${product.stock}) للمنتج: ${product.name}` },
            { status: 400 }
          )
        }
      }
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
      
      // Normalize payment method
      const normalizedPayment = normalizePaymentMethod(paymentMethod)

      // Use the timestamp-based number
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          customerId: customerId || null,
          userId: session.user.id,
          totalAmount,
          paidAmount: paidAmount || 0,
          discount: discount || 0,
          tax,
          paymentMethod: normalizedPayment,
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
          paymentMethod: normalizedPayment
        }
      })

      return NextResponse.json({
        success: true,
        sale,
        message: 'تم حفظ الفاتورة بنجاح'
      })
    }

    // Normalize payment method
    const normalizedPayment = normalizePaymentMethod(paymentMethod)

    // Create the sale with items (normal case or delivery note)
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: generatedInvoiceNumber,
        customerId: customerId || null,
        userId: session.user.id,
        totalAmount,
        paidAmount: isDeliveryNote ? 0 : (paidAmount || 0),
        discount: discount || 0,
        tax,
        paymentMethod: normalizedPayment,
        notes,
        status: isDeliveryNote ? 'PENDING' : 'COMPLETED',
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

    // Update product stock unless it's a delivery note
    if (!isDeliveryNote) {
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

    // Create cashbox transaction for income unless delivery note
    if (!isDeliveryNote) {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: paidAmount || 0,
          description: `فاتورة مبيعات ${generatedInvoiceNumber}`,
          reference: sale.id,
          paymentMethod: normalizedPayment
        }
      })
    }

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