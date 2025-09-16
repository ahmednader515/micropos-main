import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('id')
    
    if (!purchaseId) {
      return NextResponse.json(
        { error: 'معرف الفاتورة مطلوب' },
        { status: 400 }
      )
    }

    // Fetch purchase data with all related information
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        supplier: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'فاتورة المشتريات غير موجودة' },
        { status: 404 }
      )
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set RTL text direction and Arabic font support
    doc.setR2L(true)
    
    // Load custom Arabic font using jsPDF's proper font loading mechanism
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const fontBuffer = readFileSync(fontPath)
      
      // Add the font to jsPDF's virtual file system
      doc.addFileToVFS('Amiri-Regular.ttf', fontBuffer.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold')
      
      doc.setFont('Amiri', 'normal')
      console.log('Custom font loaded successfully')
    } catch (fontError) {
      console.warn('Could not load custom font, using default:', fontError)
      // Fallback to default font
      doc.setFont('Amiri', 'normal')
    }

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('ar-EG', {
        style: 'currency',
        currency: 'EGP'
      })
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
    doc.text('فاتورة مشتريات', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    // Invoice number and date
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`رقم الفاتورة: ${purchase.invoiceNumber}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    doc.text(`التاريخ: ${formatDate(purchase.createdAt)}`, margin, currentY, { align: 'left', isInputRtl: true })
    currentY += 20

    // Supplier information
    if (purchase.supplier) {
      doc.setFontSize(14)
      doc.setTextColor(44, 90, 160)
      doc.text('بيانات المورد', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
      currentY += 10

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`الاسم: ${purchase.supplier.name}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
      currentY += 8

      if (purchase.supplier.phone) {
        doc.text(`الهاتف: ${purchase.supplier.phone}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
        currentY += 8
      }

      if (purchase.supplier.address) {
        doc.text(`العنوان: ${purchase.supplier.address}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
        currentY += 8
      }

      currentY += 10
    }

    // Items table header
    doc.setFontSize(14)
    doc.setTextColor(44, 90, 160)
    doc.text('تفاصيل الفاتورة', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    // Table headers
    const colWidths = [30, 40, 30, 30, 30, 30] // Product, Quantity, Cost, Discount, Total
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                         margin + colWidths[0] + colWidths[1] + colWidths[2],
                         margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
                         margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]]

    // Header background
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, contentWidth, 15, 'F')

    // Header text
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('Amiri', 'bold')
    doc.text('الإجمالي', colPositions[5] + colWidths[5] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الخصم', colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('التكلفة', colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('الكمية', colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('المنتج', colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
    doc.text('م', colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })

    currentY += 20

    // Items rows
    doc.setFont('Amiri', 'normal')
    let totalAmount = 0
    let totalDiscount = 0

    purchase.items.forEach((item: any, index: number) => {
      // Check if we need a new page
      if (currentY + 15 > pageHeight - margin - 50) {
        doc.addPage()
        currentY = margin
      }

      const itemTotal = Number(item.price) * item.quantity - Number(item.discount)
      totalAmount += itemTotal
      totalDiscount += Number(item.discount)

      // Row background (alternating)
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, currentY, contentWidth, 15, 'F')
      }

      // Row data
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text((index + 1).toString(), colPositions[0] + colWidths[0] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.product.name, colPositions[1] + colWidths[1] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(item.quantity.toString(), colPositions[2] + colWidths[2] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.price)), colPositions[3] + colWidths[3] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(Number(item.discount)), colPositions[4] + colWidths[4] - 5, currentY + 10, { align: 'right', isInputRtl: true })
      doc.text(formatCurrency(itemTotal), colPositions[5] + colWidths[5] - 5, currentY + 10, { align: 'right', isInputRtl: true })

      currentY += 15
    })

    // Totals section
    currentY += 10

    // Check if we need a new page for totals
    if (currentY + 60 > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    // Totals background
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, contentWidth, 50, 'F')

    // Totals text
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.setTextColor(0, 0, 0)

    const subtotal = Number(purchase.totalAmount) + Number(purchase.discount) - Number(purchase.tax)
    const taxAmount = Number(purchase.tax)
    const discountAmount = Number(purchase.discount)
    const finalTotal = Number(purchase.totalAmount)

    doc.text(`الإجمالي النهائي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY + 15, { align: 'right', isInputRtl: true })
    doc.text(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY + 30, { align: 'right', isInputRtl: true })
    doc.text(`الخصم: ${formatCurrency(discountAmount)}`, pageWidth - margin, currentY + 45, { align: 'right', isInputRtl: true })

    // Payment information
    currentY += 60

    if (currentY + 30 > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    doc.setFontSize(12)
    doc.setTextColor(44, 90, 160)
    doc.text('معلومات الدفع', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 15

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`المدفوع: ${formatCurrency(Number(purchase.paidAmount))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`الباقي: ${formatCurrency(Number(purchase.totalAmount) - Number(purchase.paidAmount))}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    currentY += 10
    doc.text(`طريقة الدفع: ${getPaymentMethodText(purchase.paymentMethod)}`, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })

    // Notes
    if (purchase.notes) {
      currentY += 20
      if (currentY + 20 > pageHeight - margin) {
        doc.addPage()
        currentY = margin
      }

      doc.setFontSize(12)
      doc.setTextColor(44, 90, 160)
      doc.text('ملاحظات', pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
      currentY += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(purchase.notes, pageWidth - margin, currentY, { align: 'right', isInputRtl: true })
    }

    // Footer
    const footerY = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('شكراً لتعاملكم معنا', pageWidth / 2, footerY, { align: 'center', isInputRtl: true })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('Purchase PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase_${purchase.invoiceNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating purchase PDF:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء توليد فاتورة المشتريات' },
      { status: 500 }
    )
  }
}

function getPaymentMethodText(method: string): string {
  const methods: { [key: string]: string } = {
    'CASH': 'نقدي',
    'CARD': 'بطاقة ائتمان',
    'CREDIT': 'اجل',
    'CHECK': 'شيك',
    'MOBILE_PAYMENT': 'دفع إلكتروني',
    'CASHBOX': 'صندوق'
  }
  return methods[method] || method
}
