import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    
    // Get suppliers with their balances
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    })

    // Calculate computed balances from purchases and payments
    const computedBalances = await Promise.all(
      suppliers.map(async (supplier) => {
        const purchases = await prisma.purchase.findMany({
          where: { supplierId: supplier.id }
        })

        const payments = await prisma.payment.findMany({
          where: { supplierId: supplier.id }
        })

        const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0)
        const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        const computedBalance = totalPurchases - totalPayments

        return {
          id: supplier.id,
          name: supplier.name,
          stored: Number(supplier.balance),        // الرصيد في الذمم (Balance in Accounts)
          computed: computedBalance,               // الرصيد في الكشف (Balance in Statement/Report)
          diff: Number(supplier.balance) - computedBalance  // الفارق (Difference)
        }
      })
    )

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
    doc.text('ارصدة الموردين', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Table setup - RTL layout with 4 columns
    const tableTop = margin + 25
    const rowHeight = 12
    const col1Width = contentWidth * 0.25  // الفارق column (right side)
    const col2Width = contentWidth * 0.25  // الرصيد في الذمم column
    const col3Width = contentWidth * 0.25  // الرصيد في الكشف column
    const col4Width = contentWidth * 0.25  // الاسم column (left side)
    
    // Table headers - RTL layout with requested field names
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.setFillColor(245, 245, 245)
    
    // Header row background
    doc.rect(margin, tableTop, col1Width, rowHeight, 'F')
    doc.rect(margin + col1Width, tableTop, col2Width, rowHeight, 'F')
    doc.rect(margin + col1Width + col2Width, tableTop, col3Width, rowHeight, 'F')
    doc.rect(margin + col1Width + col2Width + col3Width, tableTop, col4Width, rowHeight, 'F')
    
    // Header text - RTL order with requested field names
    doc.text('الفارق', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الرصيد في الذمم', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الرصيد في الكشف', margin + col1Width + col2Width + col3Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الاسم', margin + col1Width + col2Width + col3Width + col4Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    let currentY = tableTop + rowHeight
    
    if (computedBalances.length > 0) {
      computedBalances.forEach((supplier, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - margin) {
          doc.addPage()
          currentY = margin + 10
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
        
        // Cell content - RTL order with requested field names
        
        // الفارق (Difference) - Right column
        if (supplier.diff === 0) {
          doc.setTextColor(0, 0, 0)
        } else if (supplier.diff > 0) {
          doc.setTextColor(0, 128, 0) // Green for positive
        } else {
          doc.setTextColor(128, 0, 0) // Red for negative
        }
        doc.text(supplier.diff.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الرصيد في الذمم (Balance in Accounts) - Middle-right column
        doc.setTextColor(0, 0, 0)
        doc.text(supplier.stored.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الرصيد في الكشف (Balance in Statement/Report) - Middle-left column
        doc.text(supplier.computed.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الاسم (Name) - Left column
        doc.text(supplier.name || '-', margin + col1Width + col2Width + col3Width + col4Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        currentY += rowHeight
      })
    } else {
      // Even when no data, add the table structure with empty row
      doc.setDrawColor(221, 221, 221)
      doc.setLineWidth(0.1)
      doc.rect(margin, currentY, col1Width, rowHeight)
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight)
      
      doc.setTextColor(128, 128, 128)
      doc.text('-', margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.text('-', margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.text('-', margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.text('لا توجد بيانات', margin + col1Width + col2Width + col3Width + col4Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      currentY += rowHeight
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="supplier_audit.pdf"',
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
