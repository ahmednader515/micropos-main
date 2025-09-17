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

    // Fetch all products with their categories
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
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
    const contentWidth = pageWidth - (2 * margin)
    
    // Header
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('جرد مخزني', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
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
    const totalStock = products.reduce((sum: number, product: Product & { category: any }) => sum + product.stock, 0)
    const totalValue = products.reduce((sum: number, product: Product & { category: any }) => sum + (product.stock * parseFloat(product.price.toString())), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص الجرد', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المنتجات: ${totalProducts}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي الكمية: ${totalStock}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي القيمة: ${totalValue.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('اسم المنتج', margin, currentY, { isInputRtl: true })
    doc.text('التصنيف', margin + 60, currentY, { isInputRtl: true })
    doc.text('الكمية', margin + 100, currentY, { isInputRtl: true })
    doc.text('السعر', margin + 130, currentY, { isInputRtl: true })
    doc.text('القيمة', margin + 160, currentY, { isInputRtl: true })
    
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
      
      const productValue = product.stock * parseFloat(product.price.toString())
      
      // Color code based on stock level
      if (product.stock === 0) {
        doc.setTextColor(255, 0, 0) // Red for out of stock
      } else if (product.stock < 10) {
        doc.setTextColor(255, 165, 0) // Orange for low stock
      } else {
        doc.setTextColor(0, 0, 0) // Black for normal stock
      }
      
      doc.text(product.name, margin, currentY, { isInputRtl: true })
      doc.text(product.category?.name || 'غير محدد', margin + 60, currentY, { isInputRtl: true })
      doc.text(product.stock.toString(), margin + 100, currentY, { isInputRtl: true })
      doc.text(product.price.toFixed(2), margin + 130, currentY, { isInputRtl: true })
      doc.text(productValue.toFixed(2), margin + 160, currentY, { isInputRtl: true })
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `inventory_count_report_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating inventory count report PDF:', error)
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
