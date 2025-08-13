import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/purchases - Get purchases with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (supplierId) {
      where.supplierId = supplierId
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

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(purchases.map(purchase => ({
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      supplier: purchase.supplier ? {
        id: purchase.supplier.id,
        name: purchase.supplier.name,
        balance: purchase.supplier.balance.toString()
      } : null,
      totalAmount: purchase.totalAmount.toString(),
      paidAmount: purchase.paidAmount.toString(),
      discount: purchase.discount.toString(),
      tax: purchase.tax.toString(),
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      notes: purchase.notes,
      createdAt: purchase.createdAt.toISOString(),
      items: purchase.items.map(item => ({
        productId: item.productId,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        total: item.total
      }))
    })))
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'فشل في جلب المشتريات' },
      { status: 500 }
    )
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, items, totalAmount, paidAmount, discount, tax, paymentMethod, notes } = body

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
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    let invoiceNumber = 'PUR-001'
    if (lastPurchase) {
      const lastNumber = parseInt(lastPurchase.invoiceNumber.split('-')[1])
      invoiceNumber = `PUR-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Update product stock
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

      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock + item.quantity }
      })
    }

    // Create purchase with items
    const purchase = await prisma.purchase.create({
      data: {
        invoiceNumber,
        supplierId: supplierId || null,
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
        supplier: true,
        items: true
      }
    })

    // If supplier exists and this is a credit purchase, update supplier balance
    if (supplierId && parseFloat(paidAmount) < parseFloat(totalAmount)) {
      const remainingAmount = parseFloat(totalAmount) - parseFloat(paidAmount)
      await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          balance: {
            increment: remainingAmount
          }
        }
      })
    }

    // If payment method is CASHBOX, deduct from cashbox
    if (paymentMethod === 'CASHBOX') {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'EXPENSE',
          amount: parseFloat(paidAmount),
          description: `مشتريات: ${invoiceNumber}`,
          reference: purchase.id,
          paymentMethod: 'CASHBOX'
        }
      })
    }

    return NextResponse.json({
      message: 'تم إنشاء فاتورة المشتريات بنجاح',
      purchase: {
        id: purchase.id,
        invoiceNumber: purchase.invoiceNumber,
        supplier: purchase.supplier ? {
          id: purchase.supplier.id,
          name: purchase.supplier.name,
          balance: purchase.supplier.balance.toString()
        } : null,
        totalAmount: purchase.totalAmount.toString(),
        paidAmount: purchase.paidAmount.toString(),
        discount: purchase.discount.toString(),
        tax: purchase.tax.toString(),
        status: purchase.status,
        paymentMethod: purchase.paymentMethod,
        notes: purchase.notes,
        createdAt: purchase.createdAt.toISOString(),
        items: purchase.items.map(item => ({
          productId: item.productId,
          price: parseFloat(item.price.toString()),
          quantity: item.quantity,
          discount: parseFloat(item.discount.toString()),
          total: parseFloat(item.total.toString())
        }))
      }
    })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء فاتورة المشتريات' },
      { status: 500 }
    )
  }
}

// PUT /api/purchases/[id] - Update purchase
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, supplierId, items, totalAmount, paidAmount, discount, tax, paymentMethod, notes, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الفاتورة مطلوب' },
        { status: 400 }
      )
    }

    // Get existing purchase
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true, supplier: true }
    })

    if (!existingPurchase) {
      return NextResponse.json(
        { error: 'فاتورة المشتريات غير موجودة' },
        { status: 404 }
      )
    }

    // If status is being changed to CANCELLED, reverse stock changes
    if (status === 'CANCELLED' && existingPurchase.status !== 'CANCELLED') {
      for (const item of existingPurchase.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }
    }

    // Update purchase
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        supplierId: supplierId || null,
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount) || 0,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        status,
        paymentMethod,
        notes
      },
      include: {
        supplier: true,
        items: true
      }
    })

    return NextResponse.json({
      message: 'تم تحديث فاتورة المشتريات بنجاح',
      purchase: {
        id: updatedPurchase.id,
        invoiceNumber: updatedPurchase.invoiceNumber,
        supplier: updatedPurchase.supplier ? {
          id: updatedPurchase.supplier.id,
          name: updatedPurchase.supplier.name,
          balance: updatedPurchase.supplier.balance.toString()
        } : null,
        totalAmount: updatedPurchase.totalAmount.toString(),
        paidAmount: updatedPurchase.paidAmount.toString(),
        discount: updatedPurchase.discount.toString(),
        tax: updatedPurchase.tax.toString(),
        status: updatedPurchase.status,
        paymentMethod: updatedPurchase.paymentMethod,
        notes: updatedPurchase.notes,
        createdAt: updatedPurchase.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث فاتورة المشتريات' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchases/[id] - Delete purchase
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

    // Get existing purchase to reverse stock changes
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingPurchase) {
      return NextResponse.json(
        { error: 'فاتورة المشتريات غير موجودة' },
        { status: 404 }
      )
    }

    // Reverse product stock changes
    for (const item of existingPurchase.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    // Delete purchase (items will be deleted automatically due to cascade)
    await prisma.purchase.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'تم حذف فاتورة المشتريات بنجاح'
    })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { error: 'فشل في حذف فاتورة المشتريات' },
      { status: 500 }
    )
  }
}
