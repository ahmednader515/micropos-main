import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    await prisma.$disconnect()

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
    doc.text('الأرصدة الافتتاحية و المبالغ النقدية للموردين', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Table setup - RTL layout with 4 columns
    const tableTop = margin + 25
    const rowHeight = 12
    const col1Width = contentWidth * 0.2  // الرصيد (Balance) column (right side)
    const col2Width = contentWidth * 0.2  // المبلغ عليه (Owed) column
    const col3Width = contentWidth * 0.2  // له (Credit) column
    const col4Width = contentWidth * 0.4  // المورد (Supplier) column (left side)
    
    // Table headers - RTL layout
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, tableTop, col1Width, rowHeight, 'F')  // الرصيد column (right)
    doc.rect(margin + col1Width, tableTop, col2Width, rowHeight, 'F')  // المبلغ عليه column
    doc.rect(margin + col1Width + col2Width, tableTop, col3Width, rowHeight, 'F')  // له column
    doc.rect(margin + col1Width + col2Width + col3Width, tableTop, col4Width, rowHeight, 'F')  // المورد column (left)
    
    doc.text('الرصيد', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('المبلغ عليه', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('له', margin + col1Width + col2Width + col3Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('المورد', margin + col1Width + col2Width + col3Width + col4Width - 5, tableTop + 8, { align: 'right', isInputRtl: true })
    
    // Table rows
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    let currentY = tableTop + rowHeight
    
    suppliers.forEach((supplier, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      const balance = Number(supplier.balance || 0)
      const hasAmount = balance > 0 ? balance : 0  // We owe them
      const oweAmount = balance < 0 ? Math.abs(balance) : 0  // They owe us
      
      let supplierInfo = supplier.name || ''
      if (supplier.phone) {
        supplierInfo += ` - هاتف: ${supplier.phone}`
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 249, 249)
        doc.rect(margin, currentY, col1Width, rowHeight, 'F')
        doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'F')
        doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'F')
        doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, 'F')
      }
      
      // Row borders
      doc.setDrawColor(221, 221, 221)
      doc.setLineWidth(0.1)
      doc.rect(margin, currentY, col1Width, rowHeight)
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight)
      
      // الرصيد (Balance) - Color coded based on balance (right column)
      if (balance > 0) {
        doc.setTextColor(211, 47, 47) // Red for positive balance (we owe them)
      } else if (balance < 0) {
        doc.setTextColor(44, 90, 160) // Blue for negative balance (they owe us)
      } else {
        doc.setTextColor(102, 102, 102) // Gray for zero balance
      }
      doc.text(balance.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // المبلغ عليه (Owed) - Red for amounts we owe
      doc.setTextColor(211, 47, 47)
      doc.text(oweAmount.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // له (Credit) - Blue for amounts owed to supplier
      doc.setTextColor(44, 90, 160)
      doc.text(hasAmount.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // المورد (Supplier) - Black for supplier info (left column)
      doc.setTextColor(0, 0, 0)
      doc.text(supplierInfo, margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
      
      currentY += rowHeight
    })
    
    // Add total row at the bottom
    const totalCredit = suppliers.reduce((sum, supplier) => {
      const balance = Number(supplier.balance || 0)
      return sum + (balance > 0 ? balance : 0)
    }, 0)
    
    const totalDebit = suppliers.reduce((sum, supplier) => {
      const balance = Number(supplier.balance || 0)
      return sum + (balance < 0 ? Math.abs(balance) : 0)
    }, 0)
    
    const netBalance = totalCredit - totalDebit
    
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
    doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, 'F')
    
    doc.setFont('Amiri', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('الإجمالي', margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
    doc.setTextColor(44, 90, 160)
    doc.text(totalCredit.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    doc.setTextColor(211, 47, 47)
    doc.text(totalDebit.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Net balance with color coding
    if (netBalance > 0) {
      doc.setTextColor(211, 47, 47) // Red for positive net balance (we owe more)
    } else if (netBalance < 0) {
      doc.setTextColor(44, 90, 160) // Blue for negative net balance (they owe more)
    } else {
      doc.setTextColor(102, 102, 102) // Gray for zero net balance
    }
    doc.text(netBalance.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="supplier_balances.pdf"',
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
