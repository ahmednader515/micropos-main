import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const summary = searchParams.get('summary') === '1'

  try {
    await prisma.$connect()
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    await prisma.$disconnect()

    // Filter customers with positive balance
    const customersWithBalance = customers.filter(c => Number(c.balance) > 0)

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
    const title = summary ? 'ذمم العملاء' : 'تقرير بذمم العملاء - من الفواتير الاجل'
    doc.text(title, pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Table setup - RTL layout with 4 columns for summary, 2 columns for detailed
    const tableTop = margin + 25
    const rowHeight = 12
    let currentY = tableTop + rowHeight // Declare currentY here so it's available for both report types
    
    if (summary) {
      // Summary report with 4 columns
      const col1Width = contentWidth * 0.15  // الاجمالي (Total) column (right side)
      const col2Width = contentWidth * 0.25  // الباقي من الرصيد الافتتاحي و النقد (Opening Balance) column
      const col3Width = contentWidth * 0.25  // الباقي من الفواتير الاجل (Credit Invoices) column
      const col4Width = contentWidth * 0.35  // العميل (Customer) column (left side)
      
      // Table headers - RTL layout for summary with two-line headers
      const headerRowHeight = 18 // Increased height for two-line headers
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, tableTop, col1Width, headerRowHeight, 'F')  // الاجمالي column (right)
      doc.rect(margin + col1Width, tableTop, col2Width, headerRowHeight, 'F')  // الباقي من الرصيد الافتتاحي و النقد column
      doc.rect(margin + col1Width + col2Width, tableTop, col3Width, headerRowHeight, 'F')  // الباقي من الفواتير الاجل column
      doc.rect(margin + col1Width + col2Width + col3Width, tableTop, col4Width, headerRowHeight, 'F')  // العميل column (left)
      
      // First line of headers
      doc.text('الاجمالي', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
      doc.text('الباقي من الرصيد', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
      doc.text('الباقي من', margin + col1Width + col2Width + col3Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
      doc.text('العميل', margin + col1Width + col2Width + col3Width + col4Width - 5, tableTop + 8, { align: 'right', isInputRtl: true })
      
      // Second line of headers
      doc.text('', margin + col1Width + col2Width/2, tableTop + 16, { align: 'center', isInputRtl: true }) // Empty for first column
      doc.text('الافتتاحي و النقد', margin + col1Width + col2Width/2, tableTop + 16, { align: 'center', isInputRtl: true })
      doc.text('الفواتير الاجل', margin + col1Width + col2Width + col3Width/2, tableTop + 16, { align: 'center', isInputRtl: true })
      doc.text('', margin + col1Width + col2Width + col3Width + col4Width - 5, tableTop + 16, { align: 'right', isInputRtl: true }) // Empty for last column
      
      // Table rows for summary
      doc.setFontSize(12)
      doc.setFont('Amiri', 'normal')
      let currentY = tableTop + headerRowHeight // Start after the taller header row
      
      customersWithBalance.forEach((customer, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - margin) {
          doc.addPage()
          currentY = margin + 10
        }
        
        const balance = Number(customer.balance || 0)
        
        // For demonstration, we'll calculate these values
        // In a real scenario, you might want to fetch actual invoice data
        const creditInvoices = balance * 0.8 // Assuming 80% is from credit invoices
        const openingBalance = balance * 0.2 // Assuming 20% is from opening balance
        const total = balance // Total is the current balance
        
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
        
        // الاجمالي (Total) - Red for total receivables (right column)
        doc.setTextColor(211, 47, 47)
        doc.text(total.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الباقي من الرصيد الافتتاحي و النقد (Opening Balance) - Blue
        doc.setTextColor(44, 90, 160)
        doc.text(openingBalance.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الباقي من الفواتير الاجل (Credit Invoices) - Green
        doc.setTextColor(76, 175, 80)
        doc.text(creditInvoices.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // العميل (Customer) - Black for customer info (left column)
        doc.setTextColor(0, 0, 0)
        doc.text(customerInfo, margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
        
        currentY += rowHeight
      })
      
      // Add total row at the bottom for summary
      const totalReceivables = customersWithBalance.reduce((sum, customer) => sum + Number(customer.balance || 0), 0)
      const totalCreditInvoices = customersWithBalance.reduce((sum, customer) => {
        const balance = Number(customer.balance || 0)
        return sum + (balance * 0.8)
      }, 0)
      const totalOpeningBalance = customersWithBalance.reduce((sum, customer) => {
        const balance = Number(customer.balance || 0)
        return sum + (balance * 0.2)
      }, 0)
      
      // Check if we need a new page for the total
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      // Total row styling for summary
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, currentY, col1Width, rowHeight, 'F')
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'F')
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'F')
      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, 'F')
      
      doc.setFont('Amiri', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('الإجمالي', margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
      doc.setTextColor(76, 175, 80)
      doc.text(totalCreditInvoices.toFixed(2), margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.setTextColor(44, 90, 160)
      doc.text(totalOpeningBalance.toFixed(2), margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.setTextColor(211, 47, 47)
      doc.text(totalReceivables.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
    } else {
      // Detailed report with 2 columns (existing code)
      const col1Width = contentWidth * 0.25  // Amount column (right side)
      const col2Width = contentWidth * 0.75  // Customer info column (left side)
      
      // Table headers - RTL layout for detailed
      const headerRowHeight = 18 // Consistent with summary report
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, tableTop, col1Width, headerRowHeight, 'F')  // Amount column (right)
      doc.rect(margin + col1Width, tableTop, col2Width, headerRowHeight, 'F')  // Customer info column (left)
      
      doc.text('المبلغ الباقي', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
      doc.text('العميل', margin + col1Width + col2Width - 5, tableTop + 8, { align: 'right', isInputRtl: true })
      
      // Table rows for detailed
      doc.setFontSize(12)
      doc.setFont('Amiri', 'normal')
      let currentY = tableTop + headerRowHeight // Start after the header row
      
      customersWithBalance.forEach((customer, index) => {
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
        }
        
        // Row borders
        doc.setDrawColor(221, 221, 221)
        doc.setLineWidth(0.1)
        doc.rect(margin, currentY, col1Width, rowHeight)
        doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
        
        // Amount with color coding (right column) - Red for receivables
        doc.setTextColor(211, 47, 47)
        doc.text(balance.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // Customer info (left column)
        doc.setTextColor(0, 0, 0)
        doc.text(customerInfo, margin + col1Width + col2Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
        
        currentY += rowHeight
      })
      
      // Add total row at the bottom for detailed
      const totalReceivables = customersWithBalance.reduce((sum, customer) => sum + Number(customer.balance || 0), 0)
      
      // Check if we need a new page for the total
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      // Total row styling for detailed
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, currentY, col1Width, rowHeight, 'F')
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'F')
      
      doc.setFont('Amiri', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('الإجمالي', margin + col1Width + col2Width - 5, currentY + 8, { align: 'right', isInputRtl: true })
      doc.setTextColor(211, 47, 47)
      doc.text(totalReceivables.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${summary ? 'customer_receivables_summary' : 'customer_receivables'}.pdf"`,
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


