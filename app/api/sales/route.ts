import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/sales - Get sales with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sales.map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customer: sale.customer ? {
        id: sale.customer.id,
        name: sale.customer.name,
        balance: sale.customer.balance.toString()
      } : null,
      totalAmount: sale.totalAmount.toString(),
      paidAmount: sale.paidAmount.toString(),
      discount: sale.discount.toString(),
      tax: sale.tax.toString(),
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map(item => ({
        productId: item.productId,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        total: item.total
      }))
    })))
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'فشل في جلب المبيعات' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, items, totalAmount, paidAmount, discount, tax, paymentMethod, notes } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'يجب إضافة منتجات على الأقل' },
        { status: 400 }
      )
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'المبلغ الإجمالي يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    let invoiceNumber = 'INV-001'
    if (lastSale) {
      const lastNumber = parseInt(lastSale.invoiceNumber.split('-')[1])
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Check stock availability and update stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `المنتج ${item.name} غير موجود` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `المخزون غير كافي للمنتج ${item.name}. المتوفر: ${product.stock}` },
          { status: 400 }
        )
      }

      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity }
      })
    }

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount) || 0,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        status: 'COMPLETED',
        paymentMethod,
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
        customer: true,
        items: true
      }
    })

    // If customer exists and this is a credit sale, update customer balance
    if (customerId && parseFloat(paidAmount) < parseFloat(totalAmount)) {
      const remainingAmount = parseFloat(totalAmount) - parseFloat(paidAmount)
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            increment: remainingAmount
          }
        }
      })
    }

    // If payment method is CASHBOX, add to cashbox
    if (paymentMethod === 'CASHBOX') {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: parseFloat(paidAmount),
          description: `مبيعات: ${invoiceNumber}`,
          reference: sale.id,
          paymentMethod: 'CASHBOX'
        }
      })
    }

    return NextResponse.json({
      message: 'تم إنشاء الفاتورة بنجاح',
      sale: {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customer: sale.customer ? {
          id: sale.customer.id,
          name: sale.customer.name,
          balance: sale.customer.balance.toString()
        } : null,
        totalAmount: sale.totalAmount.toString(),
        paidAmount: sale.paidAmount.toString(),
        discount: sale.discount.toString(),
        tax: sale.tax.toString(),
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        createdAt: sale.createdAt.toISOString(),
        items: sale.items.map(item => ({
          productId: item.productId,
          price: parseFloat(item.price.toString()),
          quantity: item.quantity,
          discount: parseFloat(item.discount.toString()),
          total: parseFloat(item.total.toString())
        }))
      }
    })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الفاتورة' },
      { status: 500 }
    )
  }
}

// PUT /api/sales/[id] - Update sale
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, customerId, items, totalAmount, paidAmount, discount, tax, paymentMethod, notes, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الفاتورة مطلوب' },
        { status: 400 }
      )
    }

    // Get existing sale
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, customer: true }
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      )
    }

    // If status is being changed to CANCELLED, restore stock
    if (status === 'CANCELLED' && existingSale.status !== 'CANCELLED') {
      for (const item of existingSale.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })
      }
    }

    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        customerId: customerId || null,
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount) || 0,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        status,
        paymentMethod,
        notes
      },
      include: {
        customer: true,
        items: true
      }
    })

    return NextResponse.json({
      message: 'تم تحديث الفاتورة بنجاح',
      sale: {
        id: updatedSale.id,
        invoiceNumber: updatedSale.invoiceNumber,
        customer: updatedSale.customer ? {
          id: updatedSale.customer.id,
          name: updatedSale.customer.name,
          balance: updatedSale.customer.balance.toString()
        } : null,
        totalAmount: updatedSale.totalAmount.toString(),
        paidAmount: updatedSale.paidAmount.toString(),
        discount: updatedSale.discount.toString(),
        tax: updatedSale.tax.toString(),
        status: updatedSale.status,
        paymentMethod: updatedSale.paymentMethod,
        notes: updatedSale.notes,
        createdAt: updatedSale.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث الفاتورة' },
      { status: 500 }
    )
  }
}

// DELETE /api/sales/[id] - Delete sale
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الفاتورة مطلوب' },
        { status: 400 }
      )
    }

    // Get existing sale to restore stock
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'الفاتورة غير موجودة' },
        { status: 404 }
      )
    }

    // Restore product stock
    for (const item of existingSale.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })
    }

    // Delete sale (items will be deleted automatically due to cascade)
    await prisma.sale.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'تم حذف الفاتورة بنجاح'
    })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'فشل في حذف الفاتورة' },
      { status: 500 }
    )
  }
}
