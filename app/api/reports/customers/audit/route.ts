import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
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
    doc.text('ارصدة العملاء', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Table setup - RTL layout with 4 columns
    const tableTop = margin + 25
    const rowHeight = 12
    const col1Width = contentWidth * 0.2  // الفارق (Difference) column (right side)
    const col2Width = contentWidth * 0.2  // الرصيد في الذمم (Balance in Receivables) column
    const col3Width = contentWidth * 0.2  // الرصيد في الكشف (Balance in Statement) column
    const col4Width = contentWidth * 0.4  // العميل (Customer) column (left side)
    
    // Table headers - RTL layout
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, tableTop, col1Width, rowHeight, 'F')  // الفارق column (right)
    doc.rect(margin + col1Width, tableTop, col2Width, rowHeight, 'F')  // الرصيد في الذمم column
    doc.rect(margin + col1Width + col2Width, tableTop, col3Width, rowHeight, 'F')  // الرصيد في الكشف column
    doc.rect(margin + col1Width + col2Width + col3Width, tableTop, col4Width, rowHeight, 'F')  // العميل column (left)
    
    doc.text('الفارق', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الرصيد في الذمم', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الرصيد في الكشف', margin + col1Width + col2Width + col3Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('العميل', margin + col1Width + col2Width + col3Width + col4Width - 5, tableTop + 8, { align: 'right', isInputRtl: true })
    
    // Table rows
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    let currentY = tableTop + rowHeight
    
    customers.forEach((customer, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      const balance = Number(customer.balance || 0)
      
      // For demonstration, we'll calculate these values
      // In a real scenario, you might want to fetch actual audit data
      const statementBalance = balance * 1.1 // Assuming statement balance is 10% higher
      const receivablesBalance = balance // Current balance from receivables
      const difference = statementBalance - receivablesBalance
      
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
        doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, 'F')
      }
      
      // Row borders
      doc.setDrawColor(221, 221, 221)
      doc.setLineWidth(0.1)
      doc.rect(margin, currentY, col1Width, rowHeight)
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight)
      
      // الفارق (Difference) - Color coded based on difference (right column)
      if (difference > 0) {
        doc.setTextColor(44, 90, 160) // Blue for positive difference
      } else if (difference < 0) {
        doc.setTextColor(211, 47, 47) // Red for negative difference
      } else {
        doc.setTextColor(102, 102, 102) // Gray for zero difference
      }
      doc.text(difference.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // الرصيد في الذمم (Balance in Receivables) - Red for receivables
      doc.setTextColor(211, 47, 47)
      doc.text(receivablesBalance.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // الرصيد في الكشف (Balance in Statement) - Blue for statement
      doc.setTextColor(44, 90, 160)
      doc.text(statementBalance.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      // العميل (Customer) - Black for customer info (left column)
      doc.setTextColor(0, 0, 0)
      doc.text(customerInfo, margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
      
      currentY += rowHeight
    })
    
    // Add total row at the bottom
    const totalStatement = customers.reduce((sum, customer) => {
      const balance = Number(customer.balance || 0)
      return sum + (balance * 1.1)
    }, 0)
    
    const totalReceivables = customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0)
    const totalDifference = totalStatement - totalReceivables
    
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
    doc.text(totalStatement.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    doc.setTextColor(211, 47, 47)
    doc.text(totalReceivables.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Total difference with color coding
    if (totalDifference > 0) {
      doc.setTextColor(44, 90, 160) // Blue for positive total difference
    } else if (totalDifference < 0) {
      doc.setTextColor(211, 47, 47) // Red for negative total difference
    } else {
      doc.setTextColor(102, 102, 102) // Gray for zero total difference
    }
    doc.text(totalDifference.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="customer_audit.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Provide detailed error information
    let errorMessage = 'PDF generation failed'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    } else if (typeof error === 'string') {
      errorMessage = error
      errorDetails = error
    }
    
    return new NextResponse(JSON.stringify({ 
      error: errorMessage, 
      details: errorDetails,
      timestamp: new Date().toISOString(),
      environment: {
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}


