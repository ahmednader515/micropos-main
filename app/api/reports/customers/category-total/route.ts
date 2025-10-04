import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale } from '@prisma/client'
import { parseDateRange, sanitizeFilename } from '@/lib/dateUtils'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerName = searchParams.get('customerName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!customerName) {
      return new NextResponse(JSON.stringify({ error: 'Customer name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate date range
    let start: Date, end: Date
    try {
      const dateRange = parseDateRange(startDate, endDate)
      start = dateRange.start
      end = dateRange.end
    } catch (error) {
      return new NextResponse(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Invalid date format provided' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    await prisma.$connect()

    // Find customer by name (case-insensitive)
    const customer = await prisma.customer.findFirst({
      where: {
        name: {
          contains: customerName,
          mode: 'insensitive'
        }
      }
    })

    if (!customer) {
      await prisma.$disconnect()
      return new NextResponse(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get customer sales with items and products for the date range
    const sales = await prisma.sale.findMany({
      where: {
        customerId: customer.id,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    await prisma.$disconnect()

    // Group sales by category
    const categoryTotals: { [categoryName: string]: { total: number; count: number } } = {}
    
    sales.forEach((sale: Sale & { items: any[] }) => {
      sale.items.forEach((item: any) => {
        const categoryName = item.product.category?.name || 'غير مصنف'
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { total: 0, count: 0 }
        }
        categoryTotals[categoryName].total += Number(item.quantity) * Number(item.price)
        categoryTotals[categoryName].count += Number(item.quantity)
      })
    })

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
    doc.text('تقرير اجمالي حسب الصنف لعميل', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Customer info
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text(`العميل: ${customer.name}`, margin, margin + 25, { isInputRtl: true })
    if (customer.phone) {
      doc.text(`الهاتف: ${customer.phone}`, margin, margin + 35, { isInputRtl: true })
    }
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 45, { align: 'center', isInputRtl: true })
    
    // Summary section
    let currentY = margin + 55
    
    // Calculate overall totals
    const totalSales = sales.reduce((sum: number, sale: Sale) => sum + Number(sale.totalAmount), 0)
    const totalCategories = Object.keys(categoryTotals).length
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalSales.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد الأصناف: ${totalCategories}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Category breakdown
    if (Object.keys(categoryTotals).length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('التفصيل حسب الصنف', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('الصنف', margin, currentY, { isInputRtl: true })
      doc.text('الكمية', margin + 60, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 100, currentY, { isInputRtl: true })
      doc.text('النسبة %', margin + 140, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 6
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      Object.entries(categoryTotals).forEach(([categoryName, data]) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        const percentage = totalSales > 0 ? ((data.total / totalSales) * 100).toFixed(1) : '0.0'
        
        doc.text(categoryName, margin, currentY, { isInputRtl: true })
        doc.text(data.count.toString(), margin + 60, currentY, { isInputRtl: true })
        doc.text(data.total.toFixed(2), margin + 100, currentY, { isInputRtl: true })
        doc.text(`${percentage}%`, margin + 140, currentY, { isInputRtl: true })
        
        currentY += 5
      })
    } else {
      doc.setFontSize(12)
      doc.setFont('Amiri', 'normal')
      doc.text('لا توجد مبيعات في الفترة المحددة', margin, currentY, { isInputRtl: true })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    // Sanitize filename to handle Arabic characters
    const sanitizedName = sanitizeFilename(customer.name)
    const filename = `customer_category_total_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating customer category total report PDF:', error)
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
