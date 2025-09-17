import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale, Purchase } from '@prisma/client'

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

    // Fetch sales and purchases for cashbox movement
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const purchases = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
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
    doc.text('تقرير بحركة الصندوق', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Summary section
    let currentY = margin + 40
    
    const totalSales = sales.reduce((sum: number, sale: Sale & { customer: any; items: any[] }) => sum + parseFloat(sale.totalAmount.toString()), 0)
    const totalPurchases = purchases.reduce((sum: number, purchase: Purchase & { supplier: any; items: any[] }) => sum + parseFloat(purchase.totalAmount.toString()), 0)
    const netCashFlow = totalSales - totalPurchases
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص الحركة', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalSales.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المشتريات: ${totalPurchases.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`صافي التدفق النقدي: ${netCashFlow.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Sales table
    if (sales.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المبيعات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('رقم الفاتورة', margin + 40, currentY, { isInputRtl: true })
      doc.text('العميل', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      sales.forEach((sale: Sale & { customer: any; items: any[] }) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(sale.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(sale.invoiceNumber, margin + 40, currentY, { isInputRtl: true })
        doc.text(sale.customer?.name || 'عميل نقدي', margin + 80, currentY, { isInputRtl: true })
        doc.text(parseFloat(sale.totalAmount.toString()).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(sale.paymentMethod, margin + 150, currentY, { isInputRtl: true })
        
        currentY += 6
      })
      
      currentY += 10
    }
    
    // Purchases table
    if (purchases.length > 0) {
      doc.setFontSize(14)
      doc.setFont('Amiri', 'bold')
      doc.text('المشتريات', margin, currentY, { isInputRtl: true })
      currentY += 10
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('Amiri', 'bold')
      doc.text('التاريخ', margin, currentY, { isInputRtl: true })
      doc.text('رقم الفاتورة', margin + 40, currentY, { isInputRtl: true })
      doc.text('المورد', margin + 80, currentY, { isInputRtl: true })
      doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
      doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      purchases.forEach((purchase: Purchase & { supplier: any; items: any[] }) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        doc.text(purchase.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(purchase.invoiceNumber, margin + 40, currentY, { isInputRtl: true })
        doc.text(purchase.supplier?.name || 'مورد نقدي', margin + 80, currentY, { isInputRtl: true })
        doc.text(parseFloat(purchase.totalAmount.toString()).toFixed(2), margin + 120, currentY, { isInputRtl: true })
        doc.text(purchase.paymentMethod, margin + 150, currentY, { isInputRtl: true })
        
        currentY += 6
      })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `cashbox_movement_report_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating cashbox movement report PDF:', error)
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
