import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Fetch purchases
    let purchasesQuery: any = {
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        supplier: true,
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

    // Apply payment method filter if provided
    if (paymentMethod) {
      purchasesQuery.where.paymentMethod = paymentMethod
    }

    const purchases = await prisma.purchase.findMany(purchasesQuery)

    // Fetch payments
    let paymentsQuery: any = {
      where: {
        supplierId: { not: null },
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        supplier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    // Apply payment method filter if provided
    if (paymentMethod) {
      paymentsQuery.where.paymentMethod = paymentMethod
    }

    const payments = await prisma.payment.findMany(paymentsQuery)

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
    const title = paymentMethod ? 
      `تقرير بحركة السداد للموردين - ${getPaymentMethodText(paymentMethod)}` : 
      'تقرير بحركة السداد للموردين'
    doc.text(title, pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
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
    
    const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0)
    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المشتريات: ${totalPurchases.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المدفوعات: ${totalPayments.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد المشتريات: ${purchases.length}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد المدفوعات: ${payments.length}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Purchases table
    if (purchases.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المشتريات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('رقم الفاتورة', margin, currentY, { isInputRtl: true })
      doc.text('التاريخ', margin + 40, currentY, { isInputRtl: true })
      doc.text('المورد', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      purchases.forEach((purchase) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(purchase.invoiceNumber || `#${purchase.id}`, margin, currentY, { isInputRtl: true })
        doc.text(purchase.createdAt.toLocaleDateString('ar-SA'), margin + 40, currentY, { isInputRtl: true })
        doc.text(purchase.supplier?.name || 'غير محدد', margin + 80, currentY, { isInputRtl: true })
        doc.text(Number(purchase.totalAmount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(getPaymentMethodText(purchase.paymentMethod), margin + 150, currentY, { isInputRtl: true })
        
        currentY += 6
      })
      
      currentY += 10
    }
    
    // Payments table
    if (payments.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المدفوعات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('المبلغ', margin, currentY, { isInputRtl: true })
      doc.text('التاريخ', margin + 40, currentY, { isInputRtl: true })
      doc.text('المورد', margin + 80, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 120, currentY, { isInputRtl: true })
      doc.text('المرجع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      payments.forEach((payment) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(Number(payment.amount).toFixed(2), margin, currentY, { isInputRtl: true })
        doc.text(payment.createdAt.toLocaleDateString('ar-SA'), margin + 40, currentY, { isInputRtl: true })
        doc.text(payment.supplier?.name || 'غير محدد', margin + 80, currentY, { isInputRtl: true })
        doc.text(getPaymentMethodText(payment.paymentMethod), margin + 120, currentY, { isInputRtl: true })
        doc.text(payment.reference || 'غير محدد', margin + 150, currentY, { isInputRtl: true })
        
        currentY += 6
      })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const methodSuffix = paymentMethod ? `_${getPaymentMethodText(paymentMethod)}` : ''
    const filename = `supplier_payment_movement${methodSuffix}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating supplier payment movement report PDF:', error)
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

function getPaymentMethodText(paymentMethod: string): string {
  const paymentMethodNames: { [key: string]: string } = {
    'CASH': 'نقد',
    'CARD': 'بطاقة',
    'CHECK': 'شيك',
    'BANK_TRANSFER': 'تحويل بنكي',
    'MOBILE_PAYMENT': 'دفع محمول',
    'CASHBOX': 'صندوق'
  }
  return paymentMethodNames[paymentMethod] || paymentMethod
}
