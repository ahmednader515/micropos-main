import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!paymentMethod) {
      return new NextResponse(JSON.stringify({ error: 'طريقة الدفع مطلوبة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Fetch expenses for specific payment method
    const expenses = await prisma.expense.findMany({
      where: {
        paymentMethod: paymentMethod,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
    doc.text('تقرير بالمصروفات حسب طريقة الدفع', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Payment method details
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('بيانات طريقة الدفع', margin, margin + 30, { isInputRtl: true })
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`طريقة الدفع: ${paymentMethod}`, margin, margin + 45, { isInputRtl: true })
    
    // Date range
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(`الفترة: ${dateRange}`, margin, margin + 55, { isInputRtl: true })
    
    // Summary section
    let currentY = margin + 70
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص المصروفات', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`عدد المصروفات: ${expenses.length}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المبلغ: ${totalExpenses.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('التاريخ', margin, currentY, { isInputRtl: true })
    doc.text('الوصف', margin + 50, currentY, { isInputRtl: true })
    doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
    doc.text('الحساب', margin + 150, currentY, { isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 8
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    
    expenses.forEach((expense) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }
      
      doc.text(expense.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
      doc.text(expense.description, margin + 50, currentY, { isInputRtl: true })
      doc.text(parseFloat(expense.amount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
      doc.text(expense.account || 'غير محدد', margin + 150, currentY, { isInputRtl: true })
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `expenses_payment_method_${paymentMethod}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating expenses by payment method report PDF:', error)
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
