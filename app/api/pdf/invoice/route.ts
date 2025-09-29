import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, invoiceNumber, paidAmount, paymentMethod, notes, isPriceDisplay = false } = body

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Set RTL text direction and Arabic font support
    doc.setR2L(true)
    
    // Load custom Arabic font
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold')
      doc.setFont('Amiri', 'normal')
    } catch (error) {
      console.warn('Could not load custom Arabic font, using default font')
    }

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      const englishNumerals = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      return `${englishNumerals} ج.م`
    }

    // Helper function to get payment method text
    const getPaymentMethodText = (method: string) => {
      const paymentMethods: { [key: string]: string } = {
        'cash': 'نقدي',
        'card': 'بطاقة',
        'bank_transfer': 'تحويل بنكي',
        'check': 'شيك',
        'credit': 'آجل',
        'CASH': 'نقدي',
        'CARD': 'بطاقة',
        'BANK_TRANSFER': 'تحويل بنكي',
        'CHECK': 'شيك',
        'CREDIT': 'آجل'
      }
      return paymentMethods[method] || method
    }

    // Helper function to format date
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    let currentY = margin

    // Header
    doc.setFontSize(20)
    doc.setTextColor(44, 90, 160)
    const headerText = isPriceDisplay ? 'عرض السعر' : 'فاتورة مبيعات'
    doc.text(headerText, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    // Invoice number and date
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`رقم الفاتورة: ${invoiceNumber}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    doc.text(`التاريخ: ${formatDate(new Date())}`, margin, currentY, { align: 'left', isInputRtl: true })
    currentY += 20

    // Items table header
    doc.setFontSize(14)
    doc.setTextColor(44, 90, 160)
    doc.text('تفاصيل الفاتورة', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15


    // Table headers - Remove م column, reorder: Total, Discount, Price, Quantity, Product
    const colWidths = [30, 30, 30, 30, 50] // Total, Discount, Price, Quantity, Product
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                         margin + colWidths[0] + colWidths[1] + colWidths[2],
                         margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]]

    // Header background
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, contentWidth, 15, 'F')

    // Header text - reordered from left to right: Total, Discount, Price, Quantity, Product
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('Amiri', 'normal')
    doc.text('الإجمالي', colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الخصم', colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('السعر', colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الكمية', colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('المنتج', colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })

    currentY += 20

    // Items rows
    doc.setFont('Amiri', 'normal')
    let itemsTotalAmount = 0
    let itemsTotalDiscount = 0

    items.forEach((item: any, index: number) => {
      // Check if we need a new page
      if (currentY + 15 > pageHeight - margin - 50) {
        doc.addPage()
        currentY = margin
      }

      const itemTotal = Number(item.price) * item.quantity - Number(item.discount || 0)
      itemsTotalAmount += itemTotal
      itemsTotalDiscount += Number(item.discount || 0)

      // Row background (alternating)
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, currentY, contentWidth, 15, 'F')
      }

      // Row data - reordered to match headers: Total, Discount, Price, Quantity, Product
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(itemTotal), colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.discount || 0)), colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.price)), colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.quantity.toString(), colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.productName || item.name, colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })

      currentY += 15
    })

    // Calculate totals
    const taxRate = 0.14 // 14% tax rate
    const taxAmount = itemsTotalAmount * taxRate
    const discountAmount = itemsTotalDiscount
    const finalTotal = itemsTotalAmount + taxAmount - discountAmount

    // Totals section
    currentY += 10
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`الإجمالي النهائي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY + 15, { align: 'right', isInputRtl: true })
    if (taxAmount > 0) {
      doc.text(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY + 30, { align: 'right', isInputRtl: true })
    }
    if (discountAmount > 0) {
      doc.text(`الخصم: ${formatCurrency(discountAmount)}`, pageWidth - margin, currentY + 45, { align: 'right', isInputRtl: true })
    }

    // Payment method info - moved here after totals calculation
    currentY += 20
    doc.setFontSize(12)
    doc.setTextColor(44, 90, 160)
    doc.text('معلومات الدفع', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`المدفوع: ${formatCurrency(Number(paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`الباقي: ${formatCurrency(Number(finalTotal) - Number(paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`طريقة الدفع: ${getPaymentMethodText(paymentMethod)}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 20

    // Notes - moved to left side opposite to الإجمالي النهائي
    if (notes) {
      // Check if we have enough space for notes, if not, reduce spacing
      if (currentY + 30 > pageHeight - margin) {
        currentY = pageHeight - margin - 30
      }

      doc.setFontSize(12)
      doc.setTextColor(44, 90, 160)
      doc.text('ملاحظات', margin, currentY + 15, { align: 'left', isInputRtl: true })

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(notes, margin, currentY + 30, { align: 'left', isInputRtl: true })
    }

    // Footer
    const footerY = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    const footerText = isPriceDisplay ? 'عرض سعر - غير ملزم' : 'شكراً لتعاملكم معنا'
    doc.text(footerText, pageWidth / 2, footerY, { align: 'center', isInputRtl: true })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('Price display PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="price_display_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating price display PDF:', error)
    return new NextResponse(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return new NextResponse(JSON.stringify({ error: 'Invoice ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch invoice data from database
    const invoice = await prisma.sale.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    })

    if (!invoice) {
      return new NextResponse(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Set RTL text direction and Arabic font support
    doc.setR2L(true)
    
    // Load custom Arabic font
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold')
      doc.setFont('Amiri', 'normal')
    } catch (error) {
      console.warn('Could not load custom Arabic font, using default font')
    }

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      const englishNumerals = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      return `${englishNumerals} ج.م`
    }

    // Helper function to get payment method text
    const getPaymentMethodText = (method: string) => {
      const paymentMethods: { [key: string]: string } = {
        'cash': 'نقدي',
        'card': 'بطاقة',
        'bank_transfer': 'تحويل بنكي',
        'check': 'شيك',
        'credit': 'آجل',
        'CASH': 'نقدي',
        'CARD': 'بطاقة',
        'BANK_TRANSFER': 'تحويل بنكي',
        'CHECK': 'شيك',
        'CREDIT': 'آجل'
      }
      return paymentMethods[method] || method
    }

    // Helper function to format date
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    let currentY = margin

    // Header
    doc.setFontSize(20)
    doc.setTextColor(44, 90, 160)
    doc.text('فاتورة مبيعات', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    // Invoice number and date
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`رقم الفاتورة: ${invoice.invoiceNumber}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    doc.text(`التاريخ: ${formatDate(invoice.createdAt)}`, margin, currentY, { align: 'left', isInputRtl: true })
    currentY += 20

    // Customer information
    if (invoice.customer) {
      doc.setFontSize(12)
      doc.setTextColor(44, 90, 160)
      doc.text('بيانات العميل', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
      currentY += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`الاسم: ${invoice.customer.name}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
      currentY += 8

      if (invoice.customer.phone) {
        doc.text(`الهاتف: ${invoice.customer.phone}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
        currentY += 8
      }

      if (invoice.customer.address) {
        doc.text(`العنوان: ${invoice.customer.address}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
        currentY += 8
      }

      currentY += 10
    }

    // Items table header
    doc.setFontSize(14)
    doc.setTextColor(44, 90, 160)
    doc.text('تفاصيل الفاتورة', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    // Payment method info - moved here below تفاصيل الفاتورة
    doc.setFontSize(12)
    doc.setTextColor(44, 90, 160)
    doc.text('معلومات الدفع', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`المدفوع: ${formatCurrency(Number(invoice.paidAmount))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`الباقي: ${formatCurrency(Number(invoice.totalAmount) - Number(invoice.paidAmount))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`طريقة الدفع: ${getPaymentMethodText(invoice.paymentMethod)}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 20

    // Table headers - Remove م column, reorder: Total, Discount, Price, Quantity, Product
    const colWidths = [30, 30, 30, 30, 50] // Total, Discount, Price, Quantity, Product
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                         margin + colWidths[0] + colWidths[1] + colWidths[2],
                         margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]]

    // Header background
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, contentWidth, 15, 'F')

    // Header text - reordered from left to right: Total, Discount, Price, Quantity, Product
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('Amiri', 'normal')
    doc.text('الإجمالي', colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الخصم', colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('السعر', colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الكمية', colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('المنتج', colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })

    currentY += 20

    // Items rows
    doc.setFont('Amiri', 'normal')
    let itemsTotalAmount = 0
    let itemsTotalDiscount = 0

    invoice.items.forEach((item: any, index: number) => {
      // Check if we need a new page
      if (currentY + 15 > pageHeight - margin - 50) {
        doc.addPage()
        currentY = margin
      }

      const itemTotal = Number(item.price) * item.quantity - Number(item.discount)
      itemsTotalAmount += itemTotal
      itemsTotalDiscount += Number(item.discount)

      // Row background (alternating)
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, currentY, contentWidth, 15, 'F')
      }

      // Row data - reordered to match headers: Total, Discount, Price, Quantity, Product
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(itemTotal), colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.discount)), colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.price)), colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.quantity.toString(), colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.product.name, colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })

      currentY += 15
    })

    // Calculate totals
    const taxRate = 0.14 // 14% tax rate
    const taxAmount = itemsTotalAmount * taxRate
    const discountAmount = itemsTotalDiscount
    const finalTotal = itemsTotalAmount + taxAmount - discountAmount

    // Totals section
    currentY += 10
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`الإجمالي النهائي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY + 15, { align: 'right', isInputRtl: true })
    doc.text(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY + 30, { align: 'right', isInputRtl: true })
    doc.text(`الخصم: ${formatCurrency(discountAmount)}`, pageWidth - margin, currentY + 45, { align: 'right', isInputRtl: true })

    // Notes - moved to left side opposite to الإجمالي النهائي
    if (invoice.notes) {
      // Check if we have enough space for notes, if not, reduce spacing
      if (currentY + 30 > pageHeight - margin) {
        currentY = pageHeight - margin - 30
      }

      doc.setFontSize(12)
      doc.setTextColor(44, 90, 160)
      doc.text('ملاحظات', margin, currentY + 15, { align: 'left', isInputRtl: true })

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(invoice.notes, margin, currentY + 30, { align: 'left', isInputRtl: true })
    }

    // Footer
    const footerY = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('شكراً لتعاملكم معنا', pageWidth / 2, footerY, { align: 'center', isInputRtl: true })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return new NextResponse(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}