import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Purchase PDF request body:', JSON.stringify(body, null, 2))
    
    const { invoiceNumber, totalAmount, paidAmount, discount, tax, paymentMethod, notes, items, isPurchaseRequest } = body
    
    if (!items || !Array.isArray(items)) {
      console.error('Missing or invalid items array:', items)
      return NextResponse.json(
        { error: 'بيانات المنتجات مطلوبة' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!invoiceNumber) {
      console.error('Missing invoice number')
      return NextResponse.json(
        { error: 'رقم الفاتورة مطلوب' },
        { status: 400 }
      )
    }

    // Create PDF document - same format as sales invoices
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, 200] })
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = 5
    const margin = 2
    const contentWidth = pageWidth - margin * 2

    // Arabic font without RTL mode to avoid text reversal (same as sales)
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.setFont('Amiri', 'normal')
    } catch {
      console.warn('⚠️ Could not load Arabic font, using default')
    }

    // Helper function to properly render Arabic text (same as sales)
    const renderArabicText = (text: string, x: number, y: number, options: any = {}) => {
      // Just render the text normally without RTL mode
      doc.text(text, x, y, options)
    }

    // Helper function to format currency (same as sales)
    const formatCurrency = (amount: number) =>
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    // Helper function to get payment method text (same as sales)
    const getPaymentMethodText = (method: string) => {
      const map: Record<string, string> = {
        cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل', check: 'شيك', credit: 'آجل'
      }
      return map[method.toLowerCase()] || method
    }

    // Helper function to format date (same as sales)
    const formatDate = (date: Date) =>
      date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

    // Header (same as sales)
    doc.setFontSize(12)
    renderArabicText(isPurchaseRequest ? 'طلب شراء' : 'فاتورة مشتريات', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8

    doc.setFontSize(9)
    renderArabicText(`رقم الفاتورة: ${invoiceNumber}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`التاريخ: ${formatDate(new Date())}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Items table (same format as sales)
    currentY += 5
    doc.setFontSize(8)
    renderArabicText('تفاصيل الفاتورة', pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Table headers (flipped order: Total, Price, Quantity, Product from left to right)
    const colWidths = [12, 8, 6, 25] // Total, Price, Quantity, Product
    const colPositions = [
      margin, // Total column starts at margin
      margin + colWidths[0], // Price column starts after Total
      margin + colWidths[0] + colWidths[1], // Quantity column starts after Price
      margin + colWidths[0] + colWidths[1] + colWidths[2] // Product column starts after Quantity
    ]

    // Draw table borders
    doc.setLineWidth(0.1)
    doc.setDrawColor(0, 0, 0)
    
    // Header text (flipped order) with proper alignment
    doc.setFontSize(7)
    renderArabicText('الإجمالي', colPositions[0] + colWidths[0] - 2, currentY + 5, { align: 'right' })
    renderArabicText('السعر', colPositions[1] + colWidths[1] - 2, currentY + 5, { align: 'right' })
    renderArabicText('الكمية', colPositions[2] + colWidths[2] - 2, currentY + 5, { align: 'right' })
    renderArabicText('المنتج', colPositions[3] + colWidths[3] - 2, currentY + 5, { align: 'right' })

    // Draw header border with vertical lines
    doc.rect(margin, currentY, contentWidth, 8)
    // Vertical lines
    doc.line(colPositions[1], currentY, colPositions[1], currentY + 8)
    doc.line(colPositions[2], currentY, colPositions[2], currentY + 8)
    doc.line(colPositions[3], currentY, colPositions[3], currentY + 8)
    currentY += 8 // No gap

    // Items rows (no background, with borders and vertical lines)
    items.forEach((item: any, index: number) => {
      const itemTotal = Number(item.price) * item.quantity - Number(item.discount || 0)
      
      // Row data (flipped order) with proper alignment
      doc.setFontSize(7)
      // Total column - right aligned
      renderArabicText(formatCurrency(itemTotal), colPositions[0] + colWidths[0] - 2, currentY + 5, { align: 'right' })
      // Price column - right aligned
      renderArabicText(formatCurrency(Number(item.price)), colPositions[1] + colWidths[1] - 2, currentY + 5, { align: 'right' })
      // Quantity column - center aligned
      renderArabicText(item.quantity.toString(), colPositions[2] + colWidths[2]/2, currentY + 5, { align: 'center' })
      // Product column - right aligned (Arabic text) - positioned correctly within its column
      renderArabicText(`${item.productName || item.name}`, colPositions[3] + colWidths[3] - 2, currentY + 5, { align: 'right' })

      // Draw row border with vertical lines
      doc.rect(margin, currentY, contentWidth, 8)
      // Vertical lines
      doc.line(colPositions[1], currentY, colPositions[1], currentY + 8)
      doc.line(colPositions[2], currentY, colPositions[2], currentY + 8)
      doc.line(colPositions[3], currentY, colPositions[3], currentY + 8)
      currentY += 8
    })

    // Calculate totals (same as sales)
    const itemsTotalAmount = items.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) * item.quantity - Number(item.discount || 0))
    }, 0)
    
    const taxRate = 0.14 // 14% tax rate
    const taxAmount = itemsTotalAmount * taxRate
    const discountAmount = items.reduce((sum: number, item: any) => sum + Number(item.discount || 0), 0)
    const finalTotal = itemsTotalAmount + taxAmount - discountAmount

    // Use provided totalAmount if available, otherwise use calculated
    const finalAmount = totalAmount ? Number(totalAmount) : finalTotal

    // Totals section (same as sales format)
    currentY += 5
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 4
    }
    doc.setFontSize(10)
    renderArabicText(`الإجمالي: ${formatCurrency(finalAmount)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Payment info (same as sales with proper spacing)
    if (paidAmount && Number(paidAmount) > 0) {
      renderArabicText(`المدفوع: ${formatCurrency(Number(paidAmount))}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 6
      renderArabicText(`الباقي: ${formatCurrency(Number(finalAmount) - Number(paidAmount))}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 6
    }
    
    renderArabicText(`طريقة الدفع: ${getPaymentMethodText(paymentMethod)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Notes (same as sales)
    if (notes) {
      renderArabicText(`ملاحظة: ${notes}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 8
    }

    // Footer (same as sales)
    doc.setFontSize(8)
    renderArabicText(isPurchaseRequest ? 'طلب شراء - غير ملزم' : 'شكراً لتعاملكم معنا', pageWidth / 2, currentY, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('Purchase PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating purchase PDF:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return new NextResponse(JSON.stringify({ 
      error: 'PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('id')

    if (!purchaseId) {
      return new NextResponse(JSON.stringify({ error: 'Purchase ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch purchase data from database
    await prisma.$connect()
    
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    await prisma.$disconnect()

    if (!purchase) {
      return new NextResponse(JSON.stringify({ error: 'Purchase not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create PDF document - same format as sales invoices
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, 200] })
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = 5
    const margin = 2
    const contentWidth = pageWidth - margin * 2

    // Arabic font without RTL mode to avoid text reversal (same as sales)
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.setFont('Amiri', 'normal')
    } catch {
      console.warn('⚠️ Could not load Arabic font, using default')
    }

    // Helper function to properly render Arabic text (same as sales)
    const renderArabicText = (text: string, x: number, y: number, options: any = {}) => {
      // Just render the text normally without RTL mode
      doc.text(text, x, y, options)
    }

    // Helper function to format currency (same as sales)
    const formatCurrency = (amount: number) =>
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    // Helper function to get payment method text (same as sales)
    const getPaymentMethodText = (method: string) => {
      const map: Record<string, string> = {
        cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل', check: 'شيك', credit: 'آجل'
      }
      return map[method.toLowerCase()] || method
    }

    // Helper function to format date (same as sales)
    const formatDate = (date: Date) =>
      date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

    // Header (same as sales)
    doc.setFontSize(12)
    renderArabicText('فاتورة مشتريات', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8

    doc.setFontSize(9)
    renderArabicText(`رقم الفاتورة: ${purchase.invoiceNumber}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`التاريخ: ${formatDate(purchase.createdAt)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Supplier information (same as sales format)
    if (purchase.supplier) {
      renderArabicText(`المورد: ${purchase.supplier.name}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 4
      if (purchase.supplier.phone) {
        renderArabicText(`الهاتف: ${purchase.supplier.phone}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 4
      }
      if (purchase.supplier.address) {
        renderArabicText(`العنوان: ${purchase.supplier.address}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 4
      }
      currentY += 4
    }

    // Items table (same format as sales)
    currentY += 5
    doc.setFontSize(8)
    renderArabicText('تفاصيل الفاتورة', pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Table headers (flipped order: Total, Price, Quantity, Product from left to right)
    const colWidths = [12, 8, 6, 25] // Total, Price, Quantity, Product
    const colPositions = [
      margin, // Total column starts at margin
      margin + colWidths[0], // Price column starts after Total
      margin + colWidths[0] + colWidths[1], // Quantity column starts after Price
      margin + colWidths[0] + colWidths[1] + colWidths[2] // Product column starts after Quantity
    ]

    // Draw table borders
    doc.setLineWidth(0.1)
    doc.setDrawColor(0, 0, 0)
    
    // Header text (flipped order) with proper alignment
    doc.setFontSize(7)
    renderArabicText('الإجمالي', colPositions[0] + colWidths[0] - 2, currentY + 5, { align: 'right' })
    renderArabicText('السعر', colPositions[1] + colWidths[1] - 2, currentY + 5, { align: 'right' })
    renderArabicText('الكمية', colPositions[2] + colWidths[2] - 2, currentY + 5, { align: 'right' })
    renderArabicText('المنتج', colPositions[3] + colWidths[3] - 2, currentY + 5, { align: 'right' })

    // Draw header border with vertical lines
    doc.rect(margin, currentY, contentWidth, 8)
    // Vertical lines
    doc.line(colPositions[1], currentY, colPositions[1], currentY + 8)
    doc.line(colPositions[2], currentY, colPositions[2], currentY + 8)
    doc.line(colPositions[3], currentY, colPositions[3], currentY + 8)
    currentY += 8 // No gap

    // Items rows (no background, with borders and vertical lines)
    purchase.items.forEach((item: any, index: number) => {
      const itemTotal = Number(item.price) * item.quantity - Number(item.discount || 0)
      
      // Row data (flipped order)
      doc.setFontSize(7)
      renderArabicText(formatCurrency(itemTotal), colPositions[0] + colWidths[0] - 2, currentY + 5, { align: 'right' })
      renderArabicText(formatCurrency(Number(item.price)), colPositions[1] + colWidths[1] - 2, currentY + 5, { align: 'right' })
      renderArabicText(item.quantity.toString(), colPositions[2] + colWidths[2] - 2, currentY + 5, { align: 'right' })
      renderArabicText(`${item.product.name}`, colPositions[3] + colWidths[3] - 2, currentY + 5, { align: 'right' })

      // Draw row border with vertical lines
      doc.rect(margin, currentY, contentWidth, 8)
      // Vertical lines
      doc.line(colPositions[1], currentY, colPositions[1], currentY + 8)
      doc.line(colPositions[2], currentY, colPositions[2], currentY + 8)
      doc.line(colPositions[3], currentY, colPositions[3], currentY + 8)
      currentY += 8
    })

    // Calculate totals (same as sales)
    const itemsTotalAmount = purchase.items.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) * item.quantity - Number(item.discount || 0))
    }, 0)
    
    const taxRate = 0.14 // 14% tax rate
    const taxAmount = itemsTotalAmount * taxRate
    const discountAmount = purchase.items.reduce((sum: number, item: any) => sum + Number(item.discount || 0), 0)
    const finalTotal = itemsTotalAmount + taxAmount - discountAmount

    // Use provided totalAmount if available, otherwise use calculated
    const finalAmount = purchase.totalAmount ? Number(purchase.totalAmount) : finalTotal

    // Totals section (same as sales format)
    currentY += 5
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 4
    }
    doc.setFontSize(10)
    renderArabicText(`الإجمالي: ${formatCurrency(finalAmount)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Payment info (same as sales with proper spacing)
    if (purchase.paidAmount && Number(purchase.paidAmount) > 0) {
      renderArabicText(`المدفوع: ${formatCurrency(Number(purchase.paidAmount))}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 6
      renderArabicText(`الباقي: ${formatCurrency(Number(finalAmount) - Number(purchase.paidAmount))}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 6
    }
    
    renderArabicText(`طريقة الدفع: ${getPaymentMethodText(purchase.paymentMethod)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Notes (same as sales)
    if (purchase.notes) {
      renderArabicText(`ملاحظة: ${purchase.notes}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 8
    }

    // Footer (same as sales)
    doc.setFontSize(8)
    renderArabicText('شكراً لتعاملكم معنا', pageWidth / 2, currentY, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase_${purchase.invoiceNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating purchase PDF:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}