import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale, Payment } from '@prisma/client'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Build query for sales with optional payment method filter
    let salesQuery: any = {
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    // Add payment method filter if specified
    if (paymentMethod) {
      salesQuery.where.paymentMethod = paymentMethod
    }

    const sales = await prisma.sale.findMany(salesQuery)

    // Get receipts and payments for the same period
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const payments = await prisma.payment.findMany({
      where: {
        type: 'PAY',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
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
    
    const paymentMethodNames: { [key: string]: string } = {
      'CASH': 'نقدا',
      'CARD': 'بطاقة',
      'CHECK': 'شيك'
    }
    
    const reportTitle = paymentMethod 
      ? `تقرير بحركة السداد للعملاء - ${paymentMethodNames[paymentMethod] || paymentMethod}`
      : 'تقرير بحركة السداد للعملاء'
    
    doc.text(reportTitle, pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
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
    
    const totalSales = sales.reduce((sum: number, sale: Sale & { customer: any; items: any[] }) => sum + Number(sale.totalAmount), 0)
    const totalReceipts = receipts.reduce((sum: number, receipt: Payment & { customer: any }) => sum + Number(receipt.amount), 0)
    const totalPayments = payments.reduce((sum: number, payment: Payment & { customer: any }) => sum + Number(payment.amount), 0)
    
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
    doc.text(`عدد المعاملات: ${sales.length + receipts.length + payments.length}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Sales transactions
    if (sales.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المبيعات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Sales table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('العميل', margin + 30, currentY, { isInputRtl: true })
      doc.text('رقم الفاتورة', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 6
      
      // Sales table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      sales.forEach((sale: Sale & { customer: any; items: any[] }) => {
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(sale.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(sale.customer?.name || 'غير محدد', margin + 30, currentY, { isInputRtl: true })
        doc.text(sale.invoiceNumber || 'غير محدد', margin + 80, currentY, { isInputRtl: true })
        doc.text(Number(sale.totalAmount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(paymentMethodNames[sale.paymentMethod] || sale.paymentMethod, margin + 150, currentY, { isInputRtl: true })
        
        currentY += 5
      })
      
      currentY += 10
    }
    
    // Receipts transactions
    if (receipts.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المقبوضات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Receipts table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('العميل', margin + 30, currentY, { isInputRtl: true })
      doc.text('رقم السند', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('المرجع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 6
      
      // Receipts table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      receipts.forEach((receipt: Payment & { customer: any }) => {
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(receipt.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(receipt.customer?.name || 'غير محدد', margin + 30, currentY, { isInputRtl: true })
        doc.text(receipt.id, margin + 80, currentY, { isInputRtl: true })
        doc.text(Number(receipt.amount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(receipt.reference || 'غير محدد', margin + 150, currentY, { isInputRtl: true })
        
        currentY += 5
      })
      
      currentY += 10
    }
    
    // Payments transactions
    if (payments.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المدفوعات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Payments table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('العميل', margin + 30, currentY, { isInputRtl: true })
      doc.text('رقم السند', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('المرجع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 6
      
      // Payments table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      payments.forEach((payment: Payment & { customer: any }) => {
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(payment.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(payment.customer?.name || 'غير محدد', margin + 30, currentY, { isInputRtl: true })
        doc.text(payment.id, margin + 80, currentY, { isInputRtl: true })
        doc.text(Number(payment.amount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(payment.reference || 'غير محدد', margin + 150, currentY, { isInputRtl: true })
        
        currentY += 5
      })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `payment_movement_${paymentMethod || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating payment movement report PDF:', error)
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
