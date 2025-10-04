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
        address: sale.customer.address
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
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`

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
    renderArabicText('فاتورة مبيعات', pageWidth / 2, currentY, { align: 'center' })
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

    // Items
    doc.setFontSize(10)
    renderArabicText('تفاصيل الفاتورة:', pageWidth - margin, currentY, { align: 'right' })
    currentY += 6

    let totalAmount = 0
    let totalDiscount = 0

    pdfData.items.forEach((item: any, i: number) => {
      const itemTotal = Number(item.price) * item.quantity - Number(item.discount || 0)
      totalAmount += itemTotal
      totalDiscount += Number(item.discount || 0)

      doc.setFontSize(8)
      renderArabicText(`${item.name}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 4
      renderArabicText(
        `${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}`,
        pageWidth - margin,
        currentY,
        { align: 'right' }
      )
      currentY += 6
    })

    // Totals
    const taxRate = 0.14
    const taxAmount = totalAmount * taxRate
    const finalTotal = totalAmount + taxAmount - totalDiscount

    doc.setFontSize(10)
    renderArabicText(`الإجمالي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }
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
    renderArabicText(`طريقة الدفع: ${getPaymentMethodText(pdfData.paymentMethod)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 8

    // Notes
    if (pdfData.notes) {
      doc.setFontSize(9)
      renderArabicText('ملاحظات:', margin, currentY, { align: 'left' })
      currentY += 5
      renderArabicText(pdfData.notes, margin, currentY, { align: 'left', maxWidth: contentWidth - 5 })
      currentY += 8
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
      `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`

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

    // 🔹 Items
    doc.setFontSize(10)
    renderArabicText('تفاصيل الفاتورة:', pageWidth - margin, currentY, { align: 'right' })
    currentY += 6

    let totalAmount = 0
    let totalDiscount = 0

    items.forEach((item: any, i: number) => {
      const itemTotal = Number(item.price) * item.quantity - Number(item.discount || 0)
      totalAmount += itemTotal
      totalDiscount += Number(item.discount || 0)

      doc.setFontSize(8)
      renderArabicText(`${item.name}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 4
      renderArabicText(
        `${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(itemTotal)}`,
        pageWidth - margin,
        currentY,
        { align: 'right' }
      )
      currentY += 6
    })

    // 🔹 Totals
    const taxRate = 0.14
    const taxAmount = totalAmount * taxRate
    const finalTotal = totalAmount + taxAmount - totalDiscount

    doc.setFontSize(10)
    renderArabicText(`الإجمالي: ${formatCurrency(finalTotal)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 5
    if (taxAmount > 0) {
      renderArabicText(`الضريبة: ${formatCurrency(taxAmount)}`, pageWidth - margin, currentY, { align: 'right' })
      currentY += 5
    }
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
