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
      case 'cash':
        salesQuery.where.paymentMethod = 'CASH'
        break
      case 'credit':
        salesQuery.where.paymentMethod = 'CREDIT'
        break
      case 'card':
        salesQuery.where.paymentMethod = 'CARD'
        break
      case 'check':
        salesQuery.where.paymentMethod = 'CHECK'
        break
      case 'cancelled':
        salesQuery.where.status = 'CANCELLED'
        break
      case 'quotes':
        salesQuery.where.status = 'QUOTE'
        break
      case 'tax-by-category':
        // For tax reports, we'll show all sales and calculate tax by category
        break
      case 'tax-by-customer':
        // For tax reports, we'll show all sales and calculate tax by customer
        break
      case 'category':
        if (categoryId) {
          salesQuery.where.items = {
            some: {
              product: {
                categoryId: categoryId
              }
            }
          }
        }
        break
      case 'by-category':
        if (categoryName) {
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
      case 'customer':
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
      'period': 'تقرير بالمبيعات لفترة',
      'by-product': 'تقرير بالمبيعات حسب الصنف',
      'by-category': 'تقرير بالمبيعات حسب التصنيف',
      'category': 'تقرير بالمبيعات لتصنيف',
      'cash': 'تقرير بالمبيعات النقد',
      'credit': 'تقرير بالمبيعات الاجل',
      'card': 'تقرير بالمبيعات (بطاقة)',
      'check': 'تقرير بالمبيعات (شيك)',
      'cancelled': 'تقرير بفواتير المبيعات التي تم الغائها',
      'quotes': 'تقرير بعروض الأسعار',
      'tax-by-category': 'اجمالي الضرائب حسب الصنف',
      'tax-by-customer': 'اجمالي الضرائب حسب العميل',
      'all': 'تقرير بالمبيعات (الكل)',
      'customer': 'تقرير بالمبيعات حسب العميل'
    }
    
    const title = reportTitles[reportType || 'all'] || 'تقرير بالمبيعات'
    doc.text(title, pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Date range
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(dateRange, pageWidth / 2, margin + 25, { align: 'center', isInputRtl: true })
    
    // Add specific info for category/customer reports
    if (reportType === 'category' && categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (category) {
        doc.text(`التصنيف: ${category.name}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
      }
    }
    
    if (reportType === 'by-category' && categoryName) {
      doc.text(`التصنيف: ${categoryName}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
    }
    
    if (reportType === 'customer' && customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (customer) {
        doc.text(`العميل: ${customer.name}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
      }
    }
    
    if (reportType === 'customer' && customerName) {
      doc.text(`العميل: ${customerName}`, pageWidth / 2, margin + 35, { align: 'center', isInputRtl: true })
    }
    
    // Summary section
    let currentY = margin + (reportType === 'category' || reportType === 'customer' || reportType === 'by-category' ? 45 : 35)
    
    const totalAmount = sales.reduce((sum: number, sale: Sale & { customer: any; items: any[] }) => sum + Number(sale.totalAmount), 0)
    const totalQuantity = sales.reduce((sum: number, sale: Sale & { customer: any; items: any[] }) => sum + sale.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص التقرير', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalAmount.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي الكمية: ${totalQuantity}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`عدد الفواتير: ${sales.length}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    
    // Add tax calculations for tax reports
    if (reportType === 'tax-by-category' || reportType === 'tax-by-customer') {
      const taxRate = 0.15 // 15% tax rate - adjust as needed
      const totalTax = totalAmount * taxRate
      doc.text(`إجمالي الضرائب: ${totalTax.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
      currentY += 8
      doc.text(`معدل الضريبة: ${(taxRate * 100).toFixed(1)}%`, margin, currentY, { isInputRtl: true })
      currentY += 8
    }
    
    currentY += 15
    
    // Table header
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('رقم الفاتورة', margin, currentY, { isInputRtl: true })
    doc.text('التاريخ', margin + 40, currentY, { isInputRtl: true })
    doc.text('العميل', margin + 80, currentY, { isInputRtl: true })
    doc.text('المبلغ', margin + 120, currentY, { isInputRtl: true })
    doc.text('طريقة الدفع', margin + 150, currentY, { isInputRtl: true })
    
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
      
      const paymentMethodNames: { [key: string]: string } = {
        'CASH': 'نقد',
        'CREDIT': 'اجل',
        'CARD': 'بطاقة',
        'CHECK': 'شيك'
      }
      
      doc.text(sale.invoiceNumber || `#${index + 1}`, margin, currentY, { isInputRtl: true })
      doc.text(sale.createdAt.toLocaleDateString('ar-SA'), margin + 40, currentY, { isInputRtl: true })
      doc.text(sale.customer?.name || 'غير محدد', margin + 80, currentY, { isInputRtl: true })
      doc.text(Number(sale.totalAmount).toFixed(2), margin + 120, currentY, { isInputRtl: true })
      doc.text(paymentMethodNames[sale.paymentMethod] || sale.paymentMethod, margin + 150, currentY, { isInputRtl: true })
      
      currentY += 6
    })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `sales_report_${reportType || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating sales report PDF:', error)
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
