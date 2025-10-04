import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Sale, Payment } from '@prisma/client'
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
      },
      include: {
        sales: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        payments: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
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

    // Get receipts separately (since there's no direct relation)
    const receipts = await prisma.payment.findMany({
      where: {
        customerId: customer.id,
        type: 'RECEIVE',
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
    const contentWidth = pageWidth - (2 * margin)
    
    // Header
    doc.setFontSize(24)
    doc.setFont('Amiri', 'bold')
    doc.text('تقرير بحركة الرصيد الافتتاحي والنقد للعميل', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
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
    
    // Calculate totals
    const totalSales = customer.sales.reduce((sum: number, sale: Sale & { items: any[] }) => sum + Number(sale.totalAmount), 0)
    const totalReceipts = receipts.reduce((sum: number, receipt: Payment) => sum + Number(receipt.amount), 0)
    const totalPayments = customer.payments.reduce((sum: number, payment: Payment) => sum + Number(payment.amount), 0)
    const currentBalance = totalSales - totalReceipts - totalPayments
    const openingBalance = Number(customer.balance)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص الحساب', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`الرصيد الافتتاحي: ${openingBalance.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المبيعات: ${totalSales.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المقبوضات: ${totalReceipts.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المدفوعات: ${totalPayments.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    
    // Color code the balance
    if (currentBalance > 0) {
      doc.setTextColor(255, 0, 0) // Red for positive balance (debt)
    } else if (currentBalance < 0) {
      doc.setTextColor(0, 128, 0) // Green for negative balance (credit)
    }
    doc.text(`الرصيد الحالي: ${currentBalance.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    doc.setTextColor(0, 0, 0) // Reset to black
    currentY += 15
    
    // Opening balance note
    doc.setFontSize(12)
    doc.setFont('Amiri', 'bold')
    doc.text('ملاحظة: هذا التقرير يوضح حركة الرصيد الافتتاحي والنقد للعميل', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFont('Amiri', 'normal')
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`وقت التقرير: ${new Date().toLocaleTimeString('ar-SA')}`, margin, currentY, { isInputRtl: true })
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    // Sanitize filename to handle Arabic characters
    const sanitizedName = sanitizeFilename(customer.name)
    const filename = `customer_opening_balance_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating customer opening balance report PDF:', error)
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
