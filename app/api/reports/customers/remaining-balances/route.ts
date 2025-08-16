import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    await prisma.$disconnect()

    // Filter customers with positive balance (remaining amounts)
    const customersWithRemaining = customers.filter(c => Number(c.balance) > 0)

    // Create PDF using jsPDF
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
      doc.setFont('helvetica', 'normal')
    }
    doc.setFontSize(16)

    // Set page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (2 * margin)
    
    // Header
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('العملاء المتبقي لهم أرصدة', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Table setup - RTL layout with 3 columns
    const tableTop = margin + 25
    const rowHeight = 12
    const col1Width = contentWidth * 0.25  // اجمالي المتبقي للعميل (Total Remaining) column (right side)
    const col2Width = contentWidth * 0.25  // رقم الهاتف (Phone Number) column (middle)
    const col3Width = contentWidth * 0.5   // اسم العميل (Customer Name) column (left side)
    
    // Table headers - RTL layout
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, tableTop, col1Width, rowHeight, 'F')  // Total Remaining column (right)
    doc.rect(margin + col1Width, tableTop, col2Width, rowHeight, 'F')  // Phone Number column (middle)
    doc.rect(margin + col1Width + col2Width, tableTop, col3Width, rowHeight, 'F')  // Customer Name column (left)
    
    doc.text('اجمالي المتبقي للعميل', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('رقم الهاتف', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('اسم العميل', margin + col1Width + col2Width + col3Width - 5, tableTop + 8, { align: 'right', isInputRtl: true })
    
    // Table rows
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    let currentY = tableTop + rowHeight
    
    customersWithRemaining.forEach((customer, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      const balance = Number(customer.balance || 0)
      let customerInfo = customer.name || ''
      if (customer.customerNumber) {
        customerInfo += ` - رقم: ${customer.customerNumber}`
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 249, 249)
        doc.rect(margin, currentY, col1Width, rowHeight, 'F')
        doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'F')
        doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'F')
      }
      
      // Row borders
      doc.setDrawColor(221, 221, 221)
      doc.setLineWidth(0.1)
      doc.rect(margin, currentY, col1Width, rowHeight)
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
      
      // اجمالي المتبقي للعميل (Total Remaining) - Red for emphasis (right column)
      doc.setTextColor(211, 47, 47)
      doc.text(balance.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // رقم الهاتف (Phone Number) - Black for standard text (middle column)
      doc.setTextColor(0, 0, 0)
      doc.text(customer.phone || '-', margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // اسم العميل (Customer Name) - Black for customer info (left column)
      doc.text(customerInfo, margin + col1Width + col2Width + col3Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
      
      currentY += rowHeight
    })
    
    // Add total row at the bottom
    const totalRemaining = customersWithRemaining.reduce((sum, customer) => sum + Number(customer.balance || 0), 0)
    
    // Check if we need a new page for the total
    if (currentY + rowHeight > pageHeight - margin) {
      doc.addPage()
      currentY = margin + 10
    }
    
    // Total row styling
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, col1Width, rowHeight, 'F')
    doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'F')
    doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'F')
    
    doc.setFont('Amiri', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('الإجمالي', margin + col1Width + col2Width + col3Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
    doc.setTextColor(0, 0, 0)
    doc.text('', margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true }) // Empty for phone column
    doc.setTextColor(211, 47, 47)
    doc.text(totalRemaining.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="customers_remaining_balances.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
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
