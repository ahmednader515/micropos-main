import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale, Payment, Customer } from '@prisma/client'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Get all customers with their sales and payments
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
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
        },
        payments: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get receipts separately (since there's no direct relation)
    const receipts = await prisma.payment.findMany({
      where: {
        type: 'RECEIVE',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: true
      }
    })

    await prisma.$disconnect()

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set RTL text direction and Arabic font support
    doc.setR2L(true)
    
    // Load custom Arabic font
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const fontBuffer = readFileSync(fontPath)
      
      doc.addFileToVFS('Amiri-Regular.ttf', fontBuffer.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold')
      
      doc.setFont('Amiri', 'normal')
    } catch (fontError) {
      console.warn('Could not load custom font, using default:', fontError)
      doc.setFont('helvetica', 'normal')
    }

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (2 * margin)
    
    // Header
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('ذمم العملاء', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Summary section
    let currentY = margin + 35
    
    // Calculate totals
    let totalSales = 0
    let totalReceipts = 0
    let totalPayments = 0
    let totalBalance = 0
    
    // Calculate receipts by customer
    const receiptsByCustomer: { [customerId: string]: number } = {}
    receipts.forEach((receipt: Payment & { customer: Customer | null }) => {
      if (receipt.customerId) {
        receiptsByCustomer[receipt.customerId] = (receiptsByCustomer[receipt.customerId] || 0) + Number(receipt.amount)
      }
    })
    
    customers.forEach((customer: Customer & { sales: (Sale & { items: any[] })[]; payments: Payment[] }) => {
      const customerSales = customer.sales.reduce((sum: number, sale: Sale & { items: any[] }) => sum + Number(sale.totalAmount), 0)
      const customerReceipts = receiptsByCustomer[customer.id] || 0
      const customerPayments = customer.payments.reduce((sum: number, payment: Payment) => sum + Number(payment.amount), 0)
      
      totalSales += customerSales
      totalReceipts += customerReceipts
      totalPayments += customerPayments
      totalBalance += (customerSales - customerReceipts - customerPayments)
    })
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalSales.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المقبوضات: ${totalReceipts.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المدفوعات: ${totalPayments.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي الذمم: ${totalBalance.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد العملاء: ${customers.length}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('اسم العميل', margin, currentY, { isInputRtl: true })
    doc.text('الهاتف', margin + 50, currentY, { isInputRtl: true })
    doc.text('المبيعات', margin + 80, currentY, { isInputRtl: true })
    doc.text('المقبوضات', margin + 110, currentY, { isInputRtl: true })
    doc.text('المدفوعات', margin + 140, currentY, { isInputRtl: true })
    doc.text('الرصيد', margin + 170, currentY, { isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 8
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    
    customers.forEach((customer: Customer & { sales: (Sale & { items: any[] })[]; payments: Payment[] }) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }
      
      const customerSales = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
      const customerReceipts = receiptsByCustomer[customer.id] || 0
      const customerPayments = customer.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const customerBalance = customerSales - customerReceipts - customerPayments
      
      doc.text(customer.name, margin, currentY, { isInputRtl: true })
      doc.text(customer.phone || 'غير محدد', margin + 50, currentY, { isInputRtl: true })
      doc.text(customerSales.toFixed(2), margin + 80, currentY, { isInputRtl: true })
      doc.text(customerReceipts.toFixed(2), margin + 110, currentY, { isInputRtl: true })
      doc.text(customerPayments.toFixed(2), margin + 140, currentY, { isInputRtl: true })
      
      // Color code the balance (positive in red, negative in green)
      if (customerBalance > 0) {
        doc.setTextColor(255, 0, 0) // Red for positive balance (debt)
      } else if (customerBalance < 0) {
        doc.setTextColor(0, 128, 0) // Green for negative balance (credit)
      }
      doc.text(customerBalance.toFixed(2), margin + 170, currentY, { isInputRtl: true })
      doc.setTextColor(0, 0, 0) // Reset to black
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `customer_balances_report_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating customer balances report PDF:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'PDF generation failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}