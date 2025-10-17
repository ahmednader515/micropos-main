import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get('id')
    
    if (!saleId) {
      return new NextResponse(JSON.stringify({ error: 'Sale ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch sale data from database
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    })

    if (!sale) {
      return new NextResponse(JSON.stringify({ error: 'Sale not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Prepare data for PDF generation
    const pdfData = {
      items: sale.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        total: item.total
      })),
      customer: sale.customer ? {
        name: sale.customer.name,
        phone: sale.customer.phone,
        address: sale.customer.address,
        balance: sale.customer.balance
      } : null,
      invoiceNumber: sale.invoiceNumber,
      paidAmount: sale.paidAmount,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      isPriceDisplay: false
    }

    // Generate PDF using the same logic as POST
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, 200] })
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = 5
    const margin = 2
    const contentWidth = pageWidth - margin * 2

    // Arabic font without RTL mode to avoid text reversal
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.setFont('Amiri', 'normal')
    } catch {
      console.warn('⚠️ Could not load Arabic font, using default')
    }

    // Helper function to properly render Arabic text
    const renderArabicText = (text: string, x: number, y: number, options: any = {}) => {
      // Just render the text normally without RTL mode
      doc.text(text, x, y, options)
    }

    // Helpers
    const formatCurrency = (amount: number) =>
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    const getPaymentMethodText = (method: string) => {
      const map: Record<string, string> = {
        cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل', check: 'شيك', credit: 'آجل'
      }
      return map[method.toLowerCase()] || method
    }

    const formatDate = (date: Date) =>
      date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

    // Header
    doc.setFontSize(12)
    const isDeliveryNote = sale.status === 'PENDING' && Number(sale.paidAmount || 0) === 0
    renderArabicText(isDeliveryNote ? 'اذن صرف' : 'فاتورة مبيعات', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8

    doc.setFontSize(9)
    renderArabicText(`رقم الفاتورة: ${pdfData.invoiceNumber}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`التاريخ: ${formatDate(new Date())}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Customer info (if provided)
    if (pdfData.customer) {
      doc.setFontSize(9)
      renderArabicText(`العميل: ${pdfData.customer.name || ''}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
      if (pdfData.customer.phone) {
        renderArabicText(`الهاتف: ${pdfData.customer.phone}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 5
      }
      if (pdfData.customer.address) {
        renderArabicText(`العنوان: ${pdfData.customer.address}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 5
      }
      currentY += 5
    }

    // Items (tabular layout)
    doc.setFontSize(10)
    renderArabicText('تفاصيل الفاتورة:', pageWidth - margin, currentY, { align: 'right' })
    currentY += 6

    // Define columns (RTL): [Total | Price | Qty | Name]
    const tableMargin = margin
    // Adjusted widths to give more space between الكمية and السعر by taking from المنتج
    const colNameWidth = contentWidth * 0.48
    const colQtyWidth = contentWidth * 0.14
    const colPriceWidth = contentWidth * 0.20
    const colTotalWidth = contentWidth * 0.18
    const colXName = tableMargin + contentWidth
    const colXQty = colXName - colNameWidth
    const colXPrice = colXQty - colQtyWidth
    const colXTotal = colXPrice - colPriceWidth

    // Header row
    doc.setFontSize(9)
    doc.setLineWidth(0.2)
    // Draw header background line
    doc.line(tableMargin, currentY, tableMargin + contentWidth, currentY)
    const tableTopY = currentY
    currentY += 4
    renderArabicText('المنتج', colXName - 1, currentY, { align: 'right' })
    renderArabicText('الكمية', colXQty - 1, currentY, { align: 'right' })
    renderArabicText('السعر', colXPrice - 1, currentY, { align: 'right' })
    renderArabicText('الإجمالي', colXTotal - 1, currentY, { align: 'right' })
    currentY += 3
    doc.line(tableMargin, currentY, tableMargin + contentWidth, currentY)
    const tableHeaderBottomY = currentY

    let totalAmount = 0
    let totalDiscount = 0
    const rowHeight = 6

    pdfData.items.forEach((item: any) => {
      const lineTotal = Number(item.price) * item.quantity
      const itemTotal = lineTotal - Number(item.discount || 0)
      totalAmount += itemTotal
      totalDiscount += Number(item.discount || 0)

      currentY += 4
      doc.setFontSize(8)
      // Item name (truncate if too long)
      const nameText = String(item.name || '')
      renderArabicText(nameText, colXName - 1, currentY, { align: 'right', maxWidth: colNameWidth - 2 })
      // Qty, Price, Total
      renderArabicText(String(item.quantity), colXQty - 1, currentY, { align: 'right' })
      renderArabicText(formatCurrency(Number(item.price)), colXPrice - 1, currentY, { align: 'right' })
      renderArabicText(formatCurrency(itemTotal), colXTotal - 1, currentY, { align: 'right' })
      currentY += rowHeight - 4
      // Row separator
      doc.setLineWidth(0.1)
      doc.line(tableMargin, currentY, tableMargin + contentWidth, currentY)
    })

    // Add spacing after table (no extra line) and draw vertical lines
    const tableBottomY = currentY
    // vertical lines at left edge, total, price, qty, and right edge
    doc.setLineWidth(0.2)
    const xLeft = tableMargin
    const xRight = tableMargin + contentWidth
    doc.line(xLeft, tableTopY, xLeft, tableBottomY)
    doc.line(colXTotal, tableTopY, colXTotal, tableBottomY)
    doc.line(colXPrice, tableTopY, colXPrice, tableBottomY)
    doc.line(colXQty, tableTopY, colXQty, tableBottomY)
    doc.line(xRight, tableTopY, xRight, tableBottomY)

    currentY += 10

    // Totals
    const taxRate = 0.14
    const taxAmount = totalAmount * taxRate
    const finalTotal = totalAmount + taxAmount - totalDiscount

    doc.setFontSize(10)
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }
    renderArabicText(`الإجمالي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    if (totalDiscount > 0) {
      renderArabicText(`الخصم: ${formatCurrency(totalDiscount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }

    // Payment info
    currentY += 4
    doc.setFontSize(9)
    renderArabicText(`المدفوع: ${formatCurrency(Number(pdfData.paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`الباقي: ${formatCurrency(finalTotal - Number(pdfData.paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`طريقة الدفع: ${isDeliveryNote ? 'اذن صرف' : getPaymentMethodText(pdfData.paymentMethod)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Notes
    if (pdfData.notes) {
      doc.setFontSize(9)
      renderArabicText('ملاحظات:', margin, currentY, { align: 'left' })
      currentY += 5
      renderArabicText(pdfData.notes, margin, currentY, { align: 'left', maxWidth: contentWidth - 5 })
      currentY += 8
    }

    // Customer debt info (if customer exists)
    if (pdfData.customer && pdfData.customer.balance !== undefined) {
      const balance = parseFloat(pdfData.customer.balance)
      if (balance !== 0) {
        doc.setFontSize(9)
        renderArabicText(`مديونية العميل: ${formatCurrency(balance)}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 6
      }
    }

    // Footer
    doc.setFontSize(8)
    renderArabicText('شكراً لتعاملكم معنا', pageWidth / 2, currentY + 5, { align: 'center' })

    // Export PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${pdfData.invoiceNumber}.pdf"`,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, invoiceNumber, paidAmount, paymentMethod, notes, isPriceDisplay = false } = body

    // ✅ Receipt size: 58mm width
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, 200] }) // 200mm height is placeholder, scroll grows
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = 5
    const margin = 2
    const contentWidth = pageWidth - margin * 2

    // Arabic font without RTL mode to avoid text reversal
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const font = readFileSync(fontPath)
      doc.addFileToVFS('Amiri-Regular.ttf', font.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.setFont('Amiri', 'normal')
    } catch {
      console.warn('⚠️ Could not load Arabic font, using default')
    }

    // Helper function to properly render Arabic text
    const renderArabicText = (text: string, x: number, y: number, options: any = {}) => {
      // Just render the text normally without RTL mode
      doc.text(text, x, y, options)
    }

    // Helpers
    const formatCurrency = (amount: number) =>
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    const getPaymentMethodText = (method: string) => {
      const map: Record<string, string> = {
        cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل', check: 'شيك', credit: 'آجل'
      }
      return map[method.toLowerCase()] || method
    }

    const formatDate = (date: Date) =>
      date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

    // 🔹 Header
    doc.setFontSize(12)
    renderArabicText(isPriceDisplay ? 'عرض سعر' : 'فاتورة مبيعات', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8

    doc.setFontSize(9)
    renderArabicText(`رقم الفاتورة: ${invoiceNumber}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`التاريخ: ${formatDate(new Date())}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // 🔹 Customer info (if provided)
    if (customer) {
      doc.setFontSize(9)
      renderArabicText(`العميل: ${customer.name || ''}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
      if (customer.phone) {
        renderArabicText(`الهاتف: ${customer.phone}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 5
      }
      if (customer.address) {
        renderArabicText(`العنوان: ${customer.address}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 5
      }
      currentY += 5
    }

    // 🔹 Items (tabular layout)
    doc.setFontSize(10)
    renderArabicText('تفاصيل الفاتورة:', pageWidth - margin, currentY, { align: 'right' })
    currentY += 6

    // Define columns (RTL): [Total | Price | Qty | Name]
    const tableMargin2 = margin
    // Adjusted widths to give more space between الكمية and السعر by taking from المنتج
    const colNameWidth2 = contentWidth * 0.48
    const colQtyWidth2 = contentWidth * 0.14
    const colPriceWidth2 = contentWidth * 0.20
    const colTotalWidth2 = contentWidth * 0.18
    const colXName2 = tableMargin2 + contentWidth
    const colXQty2 = colXName2 - colNameWidth2
    const colXPrice2 = colXQty2 - colQtyWidth2
    const colXTotal2 = colXPrice2 - colPriceWidth2

    // Header row
    doc.setFontSize(9)
    doc.setLineWidth(0.2)
    doc.line(tableMargin2, currentY, tableMargin2 + contentWidth, currentY)
    currentY += 4
    renderArabicText('المنتج', colXName2 - 1, currentY, { align: 'right' })
    renderArabicText('الكمية', colXQty2 - 1, currentY, { align: 'right' })
    renderArabicText('السعر', colXPrice2 - 1, currentY, { align: 'right' })
    renderArabicText('الإجمالي', colXTotal2 - 1, currentY, { align: 'right' })
    currentY += 3
    doc.line(tableMargin2, currentY, tableMargin2 + contentWidth, currentY)

    let totalAmount = 0
    let totalDiscount = 0
    const rowHeight2 = 6

    items.forEach((item: any) => {
      const lineTotal = Number(item.price) * item.quantity
      const itemTotal = lineTotal - Number(item.discount || 0)
      totalAmount += itemTotal
      totalDiscount += Number(item.discount || 0)

      currentY += 4
      doc.setFontSize(8)
      const nameText = String(item.name || item.productName || '')
      renderArabicText(nameText, colXName2 - 1, currentY, { align: 'right', maxWidth: colNameWidth2 - 2 })
      renderArabicText(String(item.quantity), colXQty2 - 1, currentY, { align: 'right' })
      renderArabicText(formatCurrency(Number(item.price)), colXPrice2 - 1, currentY, { align: 'right' })
      renderArabicText(formatCurrency(itemTotal), colXTotal2 - 1, currentY, { align: 'right' })
      currentY += rowHeight2 - 4
      doc.setLineWidth(0.1)
      doc.line(tableMargin2, currentY, tableMargin2 + contentWidth, currentY)
    })

    // Add spacing after table (no extra line) and draw vertical lines
    const tableBottomY2 = currentY
    doc.setLineWidth(0.2)
    const xLeft2 = tableMargin2
    const xRight2 = tableMargin2 + contentWidth
    doc.line(xLeft2, tableMargin2 === margin ? (currentY - (rowHeight2 - 4) * items.length - 7) : 0, xLeft2, tableBottomY2)
    doc.line(colXTotal2, tableMargin2 === margin ? (currentY - (rowHeight2 - 4) * items.length - 7) : 0, colXTotal2, tableBottomY2)
    doc.line(colXPrice2, tableMargin2 === margin ? (currentY - (rowHeight2 - 4) * items.length - 7) : 0, colXPrice2, tableBottomY2)
    doc.line(colXQty2, tableMargin2 === margin ? (currentY - (rowHeight2 - 4) * items.length - 7) : 0, colXQty2, tableBottomY2)
    doc.line(xRight2, tableMargin2 === margin ? (currentY - (rowHeight2 - 4) * items.length - 7) : 0, xRight2, tableBottomY2)

    currentY += 10

    // 🔹 Totals
    const taxRate = 0.14
    const taxAmount = totalAmount * taxRate
    const finalTotal = totalAmount + taxAmount - totalDiscount

    doc.setFontSize(10)
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }
    renderArabicText(`الإجمالي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    if (totalDiscount > 0) {
      renderArabicText(`الخصم: ${formatCurrency(totalDiscount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }

    // 🔹 Payment info
    currentY += 4
    doc.setFontSize(9)
    renderArabicText(`المدفوع: ${formatCurrency(Number(paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`الباقي: ${formatCurrency(finalTotal - Number(paidAmount || 0))}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    renderArabicText(`طريقة الدفع: ${getPaymentMethodText(paymentMethod)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // 🔹 Notes
    if (notes) {
      doc.setFontSize(9)
      renderArabicText('ملاحظات:', margin, currentY, { align: 'left' })
      currentY += 5
      renderArabicText(notes, margin, currentY, { align: 'left', maxWidth: contentWidth - 5 })
      currentY += 8
    }

    // 🔹 Customer debt info (if customer exists)
    if (customer && customer.balance !== undefined) {
      const balance = parseFloat(customer.balance)
      if (balance !== 0) {
        doc.setFontSize(9)
        renderArabicText(`مديونية العميل: ${formatCurrency(balance)}`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 6
      }
    }

    // 🔹 Footer
    doc.setFontSize(8)
    renderArabicText(isPriceDisplay ? 'عرض سعر - غير ملزم' : 'شكراً لتعاملكم معنا', pageWidth / 2, currentY + 5, { align: 'center' })

    // ✅ Export PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt_${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    return new NextResponse(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
