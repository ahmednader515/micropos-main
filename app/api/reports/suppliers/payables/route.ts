import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    
    // Get suppliers with their balances - only those with positive balances (we owe them money)
    const suppliers = await prisma.supplier.findMany({
      where: {
        balance: {
          gt: 0
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate computed balances from purchases and payments for suppliers with positive balances
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
          phone: supplier.phone,
          stored: Number(supplier.balance),
          computed: computedBalance,
          totalRemaining: Number(supplier.balance) + computedBalance
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
    
    // Header - Changed title as requested
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('الموردين المتبقي عندهم أرصدة', pageWidth / 2, margin + 18, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 25, pageWidth - margin, margin + 25)
    
    // Table setup - RTL layout with 3 columns as requested
    const tableTop = margin + 35
    const rowHeight = 12
    const col1Width = contentWidth * 0.4  // اجمالي الباقي عند الموردين column (right side)
    const col2Width = contentWidth * 0.3  // رقم التليفون column
    const col3Width = contentWidth * 0.3  // الاسم column (left side)
    
    // Table headers - RTL layout with requested fields
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.setFillColor(245, 245, 245)
    
    // Header row background
    doc.rect(margin, tableTop, col1Width, rowHeight, 'F')  // اجمالي الباقي column (right)
    doc.rect(margin + col1Width, tableTop, col2Width, rowHeight, 'F')  // رقم التليفون column
    doc.rect(margin + col1Width + col2Width, tableTop, col3Width, rowHeight, 'F')  // الاسم column (left)
    
    // Header text - RTL order with requested field names
    doc.text('اجمالي الباقي عند الموردين', margin + col1Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('رقم التليفون', margin + col1Width + col2Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    doc.text('الاسم', margin + col1Width + col2Width + col3Width/2, tableTop + 8, { align: 'center', isInputRtl: true })
    
    // Table rows
    doc.setFontSize(12)
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
        }
        
        // Row borders
        doc.setDrawColor(221, 221, 221)
        doc.setLineWidth(0.1)
        doc.rect(margin, currentY, col1Width, rowHeight)
        doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
        doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
        
        // Cell content - RTL order with requested fields
        
        // اجمالي الباقي عند الموردين (Total Remaining Balance) - Red for amounts we owe
        doc.setTextColor(211, 47, 47)
        doc.text(supplier.totalRemaining.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // رقم التليفون (Phone Number) - Black
        doc.setTextColor(0, 0, 0)
        doc.text(supplier.phone || '-', margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        // الاسم (Name) - Black (left column)
        doc.text(supplier.name || '-', margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
        
        currentY += rowHeight
      })
    } else {
      // Even when no data, add the table structure with empty row
      doc.setDrawColor(221, 221, 221)
      doc.setLineWidth(0.1)
      doc.rect(margin, currentY, col1Width, rowHeight)
      doc.rect(margin + col1Width, currentY, col2Width, rowHeight)
      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight)
      
      doc.setTextColor(128, 128, 128)
      doc.text('-', margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.text('-', margin + col1Width + col2Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      doc.text('لا توجد بيانات', margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
      
      currentY += rowHeight
    }
    
    // Add total row at the bottom
    const totalRemainingBalance = computedBalances.reduce((sum, supplier) => {
      return sum + supplier.totalRemaining
    }, 0)
    
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
    doc.text('الإجمالي', margin + col1Width + col2Width + col3Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    doc.setTextColor(211, 47, 47)
    doc.text(totalRemainingBalance.toFixed(2), margin + col1Width/2, currentY + 8, { align: 'center', isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log('PDF generated successfully with jsPDF, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="suppliers_remaining_balances.pdf"',
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
