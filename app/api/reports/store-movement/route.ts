import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Store Movement API called - making database queries...')
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    console.log('📅 Date range:', { start: start.toISOString(), end: end.toISOString() })

    // Ensure Prisma is connected
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')

    // Fetch all data in parallel
    const [
      sales,
      purchases,
      expenses,
      cashboxTransactions,
      customerBalances,
      supplierBalances,
      customerPayments,
      supplierPayments
    ] = await Promise.all([
      // Sales data
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      // Purchases data
      prisma.purchase.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      // Expenses data
      prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lte: end
          }
        }
      }),
      // Cashbox transactions
      prisma.cashboxTransaction.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }),
      // Customer balances
      prisma.customer.findMany({
        select: {
          balance: true
        }
      }),
      // Supplier balances
      prisma.supplier.findMany({
        select: {
          balance: true
        }
      }),
      // Customer payments
      prisma.payment.findMany({
        where: {
          customerId: { not: null },
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }),
      // Supplier payments
      prisma.payment.findMany({
        where: {
          supplierId: { not: null },
          createdAt: {
            gte: start,
            lte: end
          }
        }
      })
    ])

    console.log('📊 Queries executed successfully, calculating results...')
    
    // Calculate cashbox balance
    const currentCashboxBalance = await prisma.cashboxTransaction.aggregate({
      _sum: {
        amount: true
      }
    })
    
    console.log('💰 Store Movement API - Cashbox aggregate result:', currentCashboxBalance)
    
    // Also get all transactions to calculate balance properly
    const allCashboxTransactions = await prisma.cashboxTransaction.findMany()
    const calculatedBalance = allCashboxTransactions.reduce((acc: number, transaction: any) => {
      return transaction.type === 'INCOME'
        ? acc + Number(transaction.amount)
        : acc - Number(transaction.amount)
    }, 0)
    
    console.log('💰 Store Movement API - Total transactions:', allCashboxTransactions.length)
    console.log('💰 Store Movement API - Calculated balance:', calculatedBalance)

    // Calculate period cashbox balance
    const periodCashboxBalance = cashboxTransactions.reduce((sum: number, transaction: any) => {
      return sum + (transaction.type === 'INCOME' ? Number(transaction.amount) : -Number(transaction.amount))
    }, 0)

    // Calculate sales metrics
    const totalSales = sales.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const cashSales = sales.filter((sale: any) => sale.paymentMethod === 'CASH').reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const creditSales = sales.filter((sale: any) => sale.paymentMethod !== 'CASH').reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const cardSales = sales.filter((sale: any) => sale.paymentMethod === 'CARD').reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const checkSales = sales.filter((sale: any) => sale.paymentMethod === 'CHECK').reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const totalReturns = sales.filter((sale: any) => sale.status === 'REFUNDED').reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0)
    const totalDiscounts = sales.reduce((sum: number, sale: any) => sum + Number(sale.discount), 0)
    const totalTaxes = sales.reduce((sum: number, sale: any) => sum + Number(sale.tax), 0)
    
    // Calculate customer balances
    const customerInvoiceBalance = sales
      .filter((sale: any) => sale.paymentMethod !== 'CASH')
      .reduce((sum: number, sale: any) => sum + (Number(sale.totalAmount) - Number(sale.paidAmount)), 0)
    
    const customerOpeningBalance = customerBalances.reduce((sum: number, customer: any) => sum + Number(customer.balance), 0)
    const customerPaymentsTotal = customerPayments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)
    
    // Calculate profits
    const totalCosts = sales.reduce((sum: number, sale: any) => {
      const saleCost = sale.items.reduce((itemSum: number, item: any) => {
        return itemSum + (Number(item.product.costPrice) * item.quantity)
      }, 0)
      return sum + saleCost
    }, 0)
    const totalProfits = totalSales - totalCosts

    // Calculate purchase metrics
    const totalPurchases = purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    const cashPurchases = purchases.filter((purchase: any) => purchase.paymentMethod === 'CASH').reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    const creditPurchases = purchases.filter((purchase: any) => purchase.paymentMethod !== 'CASH').reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    const cardPurchases = purchases.filter((purchase: any) => purchase.paymentMethod === 'CARD').reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    const checkPurchases = purchases.filter((purchase: any) => purchase.paymentMethod === 'CHECK').reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    const purchaseReturns = purchases.filter((purchase: any) => purchase.status === 'RETURNED').reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0)
    
    // Calculate supplier balances
    const supplierInvoiceBalance = purchases
      .filter((purchase: any) => purchase.paymentMethod !== 'CASH')
      .reduce((sum: number, purchase: any) => sum + (Number(purchase.totalAmount) - Number(purchase.paidAmount)), 0)
    
    const supplierOpeningBalance = supplierBalances.reduce((sum: number, supplier: any) => sum + Number(supplier.balance), 0)
    const supplierPaymentsTotal = supplierPayments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

    // Calculate net profits after expenses
    const netProfits = totalProfits - totalExpenses

    const reportData = {
      cashbox: {
        currentBalance: calculatedBalance, // Use the properly calculated balance
        periodBalance: periodCashboxBalance
      },
      sales: {
        totalSales,
        cashSales,
        creditSales,
        cardSales,
        checkSales,
        totalReturns,
        totalDiscounts,
        totalTaxes,
        customerInvoiceBalance,
        customerOpeningBalance,
        customerPaymentsTotal,
        totalProfits,
        netProfits
      },
      purchases: {
        totalPurchases,
        cashPurchases,
        creditPurchases,
        cardPurchases,
        checkPurchases,
        purchaseReturns,
        supplierInvoiceBalance,
        supplierOpeningBalance,
        supplierPaymentsTotal
      },
      expenses: {
        totalExpenses
      }
    }

    console.log('📤 Returning report data:', JSON.stringify(reportData, null, 2))
    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error fetching store movement report:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تقرير حركة المتجر' },
      { status: 500 }
    )
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect()
  }
}
