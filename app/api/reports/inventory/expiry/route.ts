import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Product } from '@prisma/client'

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

    // Fetch products with expiry dates
    const products = await prisma.product.findMany({
      where: {
        expiryDate: {
          not: null
        }
      },
      include: {
        category: true
      },
      orderBy: {
        expiryDate: 'asc'
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
    doc.text('تقرير بالمنتجات حسب تاريخ الانتهاء', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Summary section
    let currentY = margin + 35
    
    const totalProducts = products.length
    const expiredProducts = products.filter((product: Product & { category: any }) => product.expiryDate && new Date(product.expiryDate) < new Date()).length
    const expiringSoon = products.filter((product: Product & { category: any }) => {
      if (!product.expiryDate) return false
      const expiryDate = new Date(product.expiryDate)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
    }).length
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المنتجات: ${totalProducts}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`المنتجات المنتهية الصلاحية: ${expiredProducts}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`المنتجات التي تنتهي خلال 30 يوم: ${expiringSoon}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('اسم المنتج', margin, currentY, { isInputRtl: true })
    doc.text('التصنيف', margin + 60, currentY, { isInputRtl: true })
    doc.text('الكمية', margin + 100, currentY, { isInputRtl: true })
    doc.text('تاريخ الانتهاء', margin + 130, currentY, { isInputRtl: true })
    doc.text('الحالة', margin + 160, currentY, { isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 8
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    
    products.forEach((product: Product & { category: any }) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }
      
      const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      let status = 'طبيعي'
      let statusColor = [0, 0, 0] // Black
      
      if (expiryDate) {
        if (expiryDate < today) {
          status = 'منتهي الصلاحية'
          statusColor = [255, 0, 0] // Red
        } else if (expiryDate <= thirtyDaysFromNow) {
          status = 'ينتهي قريباً'
          statusColor = [255, 165, 0] // Orange
        }
      }
      
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
      
      doc.text(product.name, margin, currentY, { isInputRtl: true })
      doc.text(product.category?.name || 'غير محدد', margin + 60, currentY, { isInputRtl: true })
      doc.text(product.stock.toString(), margin + 100, currentY, { isInputRtl: true })
      doc.text(expiryDate ? expiryDate.toLocaleDateString('ar-SA') : 'غير محدد', margin + 130, currentY, { isInputRtl: true })
      doc.text(status, margin + 160, currentY, { isInputRtl: true })
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `expiry_report_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating expiry report PDF:', error)
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
