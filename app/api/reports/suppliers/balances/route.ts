import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Supplier, Purchase, Payment } from '@prisma/client'

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

    // Fetch all suppliers with their purchases and payments
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchases: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Fetch payments for each supplier separately
    const supplierPayments = await prisma.payment.findMany({
      where: {
        supplierId: { not: null },
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        supplier: true
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
    doc.text('تقرير بالمتبقي للموردين', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
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
    
    // Calculate totals
    const totalPurchases = suppliers.reduce((sum: number, supplier: Supplier & { purchases: (Purchase & { items: any[] })[]; payments: Payment[] }) =>
      sum + supplier.purchases.reduce((purchaseSum: number, purchase: Purchase & { items: any[] }) => purchaseSum + Number(purchase.totalAmount), 0), 0
    )
    
    const totalPayments = supplierPayments.reduce((sum: number, payment: Payment) => sum + Number(payment.amount), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المشتريات: ${totalPurchases.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المدفوعات: ${totalPayments.toFixed(2)} ريال`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد الموردين: ${suppliers.length}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('اسم المورد', margin, currentY, { isInputRtl: true })
    doc.text('الهاتف', margin + 60, currentY, { isInputRtl: true })
    doc.text('إجمالي المشتريات', margin + 100, currentY, { isInputRtl: true })
    doc.text('إجمالي المدفوعات', margin + 140, currentY, { isInputRtl: true })
    doc.text('الرصيد', margin + 180, currentY, { isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 8
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    
    suppliers.forEach((supplier: Supplier & { purchases: (Purchase & { items: any[] })[]; payments: Payment[] }) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }
      
      const supplierPurchases = supplier.purchases.reduce((sum: number, purchase: Purchase & { items: any[] }) => sum + Number(purchase.totalAmount), 0)
      const supplierPaymentsForSupplier = supplierPayments
        .filter((payment: Payment) => payment.supplierId === supplier.id)
        .reduce((sum: number, payment: Payment) => sum + Number(payment.amount), 0)
      
      const balance = supplierPurchases - supplierPaymentsForSupplier
      
      // Color code the balance
      const balanceColor = balance > 0 ? [255, 0, 0] : balance < 0 ? [0, 128, 0] : [0, 0, 0]
      
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2])
      
      doc.text(supplier.name, margin, currentY, { isInputRtl: true })
      doc.text(supplier.phone || 'غير محدد', margin + 60, currentY, { isInputRtl: true })
      doc.text(supplierPurchases.toFixed(2), margin + 100, currentY, { isInputRtl: true })
      doc.text(supplierPaymentsForSupplier.toFixed(2), margin + 140, currentY, { isInputRtl: true })
      doc.text(balance.toFixed(2), margin + 180, currentY, { isInputRtl: true })
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `supplier_balances_report_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating supplier balances report PDF:', error)
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