import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale } from '@prisma/client'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const customerId = searchParams.get('customerId')
    const categoryName = searchParams.get('categoryName')
    const customerName = searchParams.get('customerName')
    const invoiceNumber = searchParams.get('invoiceNumber')

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    let salesQuery: any = {
      where: {
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
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    // Apply filters based on report type
    switch (reportType) {
      case 'by-product':
        // No additional filters for by-product report
        break
      case 'by-category':
        if (categoryId) {
          salesQuery.where.items = {
            some: {
              product: {
                categoryId: categoryId
              }
            }
          }
        } else if (categoryName) {
          salesQuery.where.items = {
            some: {
              product: {
                category: {
                  name: {
                    contains: categoryName,
                    mode: 'insensitive'
                  }
                }
              }
            }
          }
        }
        break
      case 'by-customer':
        if (customerId) {
          salesQuery.where.customerId = customerId
        } else if (customerName) {
          salesQuery.where.customer = {
            name: {
              contains: customerName,
              mode: 'insensitive'
            }
          }
        }
        break
      case 'by-invoice':
        if (invoiceNumber) {
          salesQuery.where.invoiceNumber = {
            contains: invoiceNumber,
            mode: 'insensitive'
          }
        }
        break
    }

    const sales = await prisma.sale.findMany(salesQuery)
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
    const reportTitles: { [key: string]: string } = {
      'by-product': 'تقرير بالخصومات حسب الصنف',
      'by-category': 'تقرير بالخصومات حسب التصنيف',
      'by-customer': 'تقرير بالخصومات حسب العميل',
      'by-customer-balances': 'تقرير بالخصومات حسب العميل - من شاشة الذمم',
      'by-invoice': 'تقرير بالخصومات حسب رقم الفاتورة'
    }
    
    const title = reportTitles[reportType || 'by-product'] || 'تقرير بالخصومات'
    doc.text(title, pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Add specific info for category/customer/invoice reports
    if (reportType === 'by-category' && categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (category) {
        doc.text(`التصنيف: ${category.name}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
      }
    }
    
    if (reportType === 'by-category' && categoryName) {
      doc.text(`التصنيف: ${categoryName}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
    }
    
    if (reportType === 'by-customer' && customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (customer) {
        doc.text(`العميل: ${customer.name}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
      }
    }
    
    if (reportType === 'by-customer' && customerName) {
      doc.text(`العميل: ${customerName}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
    }
    
    if (reportType === 'by-invoice' && invoiceNumber) {
      doc.text(`رقم الفاتورة: ${invoiceNumber}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
    }
    
    // Summary section
    let currentY = margin + (reportType === 'by-category' || reportType === 'by-customer' || reportType === 'by-invoice' ? 45 : 35)
    
    // Calculate discounts
    let totalDiscounts = 0
    let totalSales = 0
    let discountCount = 0
    
    sales.forEach((sale: Sale & { customer: any; items: any[] }) => {
      const saleTotal = Number(sale.totalAmount)
      totalSales += saleTotal
      
      // Calculate discounts for each item
      sale.items.forEach(item => {
        const itemPrice = Number(item.price)
        const itemQuantity = item.quantity
        const itemTotal = itemPrice * itemQuantity
        
        // Check if there's a discount (assuming discount is stored as a field or calculated)
        // For now, we'll calculate based on the difference between expected price and actual price
        const expectedPrice = Number(item.product.price) * itemQuantity
        const discount = Math.max(0, expectedPrice - itemTotal)
        
        if (discount > 0) {
          totalDiscounts += discount
          discountCount++
        }
      })
    })
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalSales.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي الخصومات: ${totalDiscounts.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد الخصومات: ${discountCount}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد الفواتير: ${sales.length}`, margin, currentY, { isInputRtl: true })
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('رقم الفاتورة', margin, currentY, { isInputRtl: true })
    doc.text('التاريخ', margin + 40, currentY, { isInputRtl: true })
    doc.text('العميل', margin + 80, currentY, { isInputRtl: true })
    doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
    doc.text('الخصم', margin + 150, currentY, { isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.3)
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
    currentY += 8
    
    // Table rows
    doc.setFontSize(10)
    doc.setFont('Amiri', 'normal')
    
    sales.forEach((sale: Sale & { customer: any; items: any[] }, index: number) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }
      
      // Calculate discount for this sale
      let saleDiscount = 0
      sale.items.forEach(item => {
        const expectedPrice = Number(item.product.price) * item.quantity
        const actualPrice = Number(item.price) * item.quantity
        const discount = Math.max(0, expectedPrice - actualPrice)
        saleDiscount += discount
      })
      
      doc.text(sale.invoiceNumber || `#${index + 1}`, margin, currentY, { isInputRtl: true })
      doc.text(sale.createdAt.toLocaleDateString('ar-SA'), margin + 40, currentY, { isInputRtl: true })
      doc.text(sale.customer?.name || 'غير محدد', margin + 80, currentY, { isInputRtl: true })
      doc.text(Number(sale.totalAmount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
      doc.text(saleDiscount.toFixed(2), margin + 150, currentY, { isInputRtl: true })
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `discounts_report_${reportType || 'by_product'}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating discounts report PDF:', error)
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
