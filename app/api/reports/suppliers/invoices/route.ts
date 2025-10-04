import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierName = searchParams.get('supplierName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!supplierName) {
      return new NextResponse(JSON.stringify({ error: 'اسم المورد مطلوب' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Find supplier by name
    const supplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: supplierName,
          mode: 'insensitive'
        }
      }
    })

    if (!supplier) {
      await prisma.$disconnect()
      return new NextResponse(JSON.stringify({ error: 'المورد غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
    doc.text('تقرير بالفواتير لمورد', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Supplier details
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('بيانات المورد', margin, margin + 30, { isInputRtl: true })
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`اسم المورد: ${supplier.name}`, margin, margin + 45, { isInputRtl: true })
    doc.text(`الهاتف: ${supplier.phone || 'غير محدد'}`, margin, margin + 55, { isInputRtl: true })
    
    // Date range
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(`الفترة: ${dateRange}`, margin, margin + 65, { isInputRtl: true })
    
    // Placeholder content
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملاحظة', margin, margin + 85, { isInputRtl: true })
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text('هذا التقرير قيد التطوير وسيتم إضافة المحتوى قريباً', margin, margin + 100, { isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    // Sanitize filename to handle Arabic characters
    const sanitizedName = supplier.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    const filename = `supplier_invoices_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating supplier invoices report PDF:', error)
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
