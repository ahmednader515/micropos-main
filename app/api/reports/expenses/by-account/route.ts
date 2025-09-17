import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Fetch expenses grouped by account
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: [
        { account: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    await prisma.$disconnect()

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set RTL text direction and Arabic font support
    doc.setR2L(true)
    
    // Load custom Arabic font
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
      const fontBuffer = readFileSync(fontPath)
      
      doc.addFileToVFS('Amiri-Regular.ttf', fontBuffer.toString('base64'))
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold')
      
      doc.setFont('Amiri', 'normal')
    } catch (fontError) {
      console.warn('Could not load custom font, using default:', fontError)
      doc.setFont('helvetica', 'normal')
    }

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    
    // Header
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('تقرير بالمصروفات حسب الحساب', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Group expenses by account
    const expensesByAccount = expenses.reduce((acc, expense) => {
      const account = expense.account || 'غير محدد'
      if (!acc[account]) {
        acc[account] = []
      }
      acc[account].push(expense)
      return acc
    }, {} as Record<string, typeof expenses>)

    let currentY = margin + 40

    // Process each account
    Object.entries(expensesByAccount).forEach(([account, accountExpenses]) => {
      // Check if we need a new page
      if (currentY > pageHeight - 50) {
        doc.addPage()
        currentY = margin
      }

      // Account header
      doc.setFontSize(16)
      doc.setFont('Amiri', 'bold')
      doc.text(`الحساب: ${account}`, margin, currentY, { isInputRtl: true })
      currentY += 10

      // Account summary
      const accountTotal = accountExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

      doc.setFontSize(12)
      doc.setFont('Amiri', 'normal')
      doc.text(`عدد المصروفات: ${accountExpenses.length}`, margin, currentY, { isInputRtl: true })
      currentY += 6
      doc.text(`إجمالي المبلغ: ${accountTotal.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
      currentY += 10

      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('الوصف', margin + 50, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8

      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      accountExpenses.forEach((expense) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(expense.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(expense.description, margin + 50, currentY, { isInputRtl: true })
        doc.text(parseFloat(expense.amount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(expense.paymentMethod, margin + 150, currentY, { isInputRtl: true })
        
        currentY += 6
      })
      
      currentY += 15
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `expenses_by_account_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating expenses by account report PDF:', error)
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
