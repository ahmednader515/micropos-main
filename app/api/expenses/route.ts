import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/expenses - Get expenses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(expenses.map(expense => ({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.toISOString(),
      paymentMethod: expense.paymentMethod,
      receiptUrl: (expense as any).receiptUrl,
      createdAt: expense.createdAt.toISOString()
    })))
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'فشل في جلب المصروفات' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, amount, category, date, paymentMethod, receiptUrl } = body

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json(
        { error: 'العنوان والمبلغ مطلوبان' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'المبلغ يجب أن يكون رقماً موجباً' },
        { status: 400 }
      )
    }

    // If payment method is CASHBOX, check if there's enough balance
    if (paymentMethod === 'CASHBOX') {
      const cashboxTransactions = await prisma.cashboxTransaction.findMany()
      const cashboxBalance = cashboxTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'INCOME') {
          return acc + parseFloat(transaction.amount.toString())
        } else {
          return acc - parseFloat(transaction.amount.toString())
        }
      }, 0)

      if (cashboxBalance < amountNum) {
        return NextResponse.json(
          { error: 'رصيد الصندوق غير كافي لإتمام هذه العملية' },
          { status: 400 }
        )
      }
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: amountNum,
        category,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        receiptUrl
      } as any
    })

    // If payment method is CASHBOX, deduct from cashbox
    if (paymentMethod === 'CASHBOX') {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'EXPENSE',
          amount: amountNum,
          description: `مصروف: ${title}`,
          reference: expense.id,
          paymentMethod: 'CASHBOX' as any
        }
      })
    }

    return NextResponse.json({
      message: 'تم إضافة المصروف بنجاح',
      expense: {
        id: expense.id,
        title: expense.title,
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: expense.date.toISOString(),
        paymentMethod: expense.paymentMethod,
        receiptUrl: (expense as any).receiptUrl,
        createdAt: expense.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'فشل في إضافة المصروف' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, amount, category, date, paymentMethod, receiptUrl } = body

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المصروف مطلوب' },
        { status: 400 }
      )
    }

    // Get existing expense to check payment method changes
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'المصروف غير موجود' },
        { status: 404 }
      )
    }

    // If changing from CASHBOX to another method, refund the amount
    if ((existingExpense.paymentMethod as unknown as string) === 'CASHBOX' && paymentMethod !== 'CASHBOX') {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: existingExpense.amount,
          description: `استرداد مصروف: ${existingExpense.title}`,
          reference: id,
          paymentMethod: 'CASHBOX' as any
        }
      })
    }

    // If changing to CASHBOX, check balance and deduct
    if (paymentMethod === 'CASHBOX' && (existingExpense.paymentMethod as unknown as string) !== 'CASHBOX') {
      const cashboxTransactions = await prisma.cashboxTransaction.findMany()
      const cashboxBalance = cashboxTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'INCOME') {
          return acc + parseFloat(transaction.amount.toString())
        } else {
          return acc - parseFloat(transaction.amount.toString())
        }
      }, 0)

      if (cashboxBalance < parseFloat(amount)) {
        return NextResponse.json(
          { error: 'رصيد الصندوق غير كافي لإتمام هذه العملية' },
          { status: 400 }
        )
      }

      await prisma.cashboxTransaction.create({
        data: {
          type: 'EXPENSE',
          amount: parseFloat(amount),
          description: `مصروف: ${title}`,
          reference: id,
          paymentMethod: 'CASHBOX' as any
        }
      })
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        receiptUrl
      } as any
    })

    return NextResponse.json({
      message: 'تم تحديث المصروف بنجاح',
      expense: {
        id: updatedExpense.id,
        title: updatedExpense.title,
        description: updatedExpense.description,
        amount: updatedExpense.amount.toString(),
        category: updatedExpense.category,
        date: updatedExpense.date.toISOString(),
        paymentMethod: updatedExpense.paymentMethod,
        receiptUrl: (updatedExpense as any).receiptUrl,
        createdAt: updatedExpense.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث المصروف' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المصروف مطلوب' },
        { status: 400 }
      )
    }

    // Get existing expense to check if it was paid from cashbox
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'المصروف غير موجود' },
        { status: 404 }
      )
    }

    // If it was paid from cashbox, refund the amount
    if ((existingExpense.paymentMethod as unknown as string) === 'CASHBOX') {
      await prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: existingExpense.amount,
          description: `استرداد مصروف محذوف: ${existingExpense.title}`,
          reference: id,
          paymentMethod: 'CASHBOX' as any
        }
      })
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'تم حذف المصروف بنجاح'
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'فشل في حذف المصروف' },
      { status: 500 }
    )
  }
}
