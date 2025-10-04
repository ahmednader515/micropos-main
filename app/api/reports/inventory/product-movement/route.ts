import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'
import { SaleItem, PurchaseItem } from '@prisma/client'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!productName) {
      return new NextResponse(JSON.stringify({ error: 'اسم المنتج مطلوب' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Set default date range if not provided
    const today = new Date()
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    await prisma.$connect()

    // Find product by name
    const product = await prisma.product.findFirst({
      where: {
        name: {
          contains: productName,
          mode: 'insensitive'
        }
      },
      include: {
        category: true
      }
    })

    if (!product) {
      await prisma.$disconnect()
      return new NextResponse(JSON.stringify({ error: 'المنتج غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch sales and purchases for this product
    const sales = await prisma.saleItem.findMany({
      where: {
        productId: product.id,
        sale: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      },
      include: {
        sale: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        sale: {
          createdAt: 'desc'
        }
      }
    })

    const purchases = await prisma.purchaseItem.findMany({
      where: {
        productId: product.id,
        purchase: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      },
      include: {
        purchase: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        purchase: {
          createdAt: 'desc'
        }
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
    doc.text('تقرير بحركة منتج', pageWidth / 2, margin + 10, { align: 'center', isInputRtl: true })
    
    // Add line below header
    doc.setLineWidth(0.5)
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15)
    
    // Product details
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('بيانات المنتج', margin, margin + 30, { isInputRtl: true })
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`اسم المنتج: ${product.name}`, margin, margin + 45, { isInputRtl: true })
    doc.text(`التصنيف: ${product.category?.name || 'غير محدد'}`, margin, margin + 55, { isInputRtl: true })
    doc.text(`الكمية الحالية: ${product.stock}`, margin, margin + 65, { isInputRtl: true })
    doc.text(`السعر: ${product.price.toFixed(2)} ج.م`, margin, margin + 75, { isInputRtl: true })
    
    // Date range
    const dateRange = `من ${start.toLocaleDateString('ar-SA')} إلى ${end.toLocaleDateString('ar-SA')}`
    doc.text(`الفترة: ${dateRange}`, margin, margin + 85, { isInputRtl: true })
    
    // Summary section
    let currentY = margin + 100
    
    const totalSales = sales.reduce((sum: number, sale: SaleItem & { product: any; sale: any }) => sum + sale.quantity, 0)
    const totalPurchases = purchases.reduce((sum: number, purchase: PurchaseItem & { product: any; purchase: any }) => sum + purchase.quantity, 0)
    const salesValue = sales.reduce((sum: number, sale: SaleItem & { product: any; sale: any }) => sum + (sale.quantity * parseFloat(sale.price.toString())), 0)
    const purchasesValue = purchases.reduce((sum: number, purchase: PurchaseItem & { product: any; purchase: any }) => sum + (purchase.quantity * parseFloat(purchase.price.toString())), 0)
    
    doc.setFontSize(14)
    doc.setFont('Amiri', 'bold')
    doc.text('ملخص الحركة', margin, currentY, { isInputRtl: true })
    currentY += 10
    
    doc.setFontSize(12)
    doc.setFont('Amiri', 'normal')
    doc.text(`إجمالي المبيعات: ${totalSales} وحدة`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`إجمالي المشتريات: ${totalPurchases} وحدة`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`قيمة المبيعات: ${salesValue.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
    currentY += 8
    doc.text(`قيمة المشتريات: ${purchasesValue.toFixed(2)} ج.م`, margin, currentY, { isInputRtl: true })
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
      doc.text('العميل', margin + 50, currentY, { isInputRtl: true })
      doc.text('الكمية', margin + 100, currentY, { isInputRtl: true })
      doc.text('السعر', margin + 130, currentY, { isInputRtl: true })
      doc.text('الإجمالي', margin + 160, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      sales.forEach((sale: SaleItem & { product: any; sale: any }) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        const total = sale.quantity * parseFloat(sale.price.toString())
        
        doc.text(sale.sale.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(sale.sale.customer?.name || 'عميل نقدي', margin + 50, currentY, { isInputRtl: true })
        doc.text(sale.quantity.toString(), margin + 100, currentY, { isInputRtl: true })
        doc.text(parseFloat(sale.price.toString()).toFixed(2), margin + 130, currentY, { isInputRtl: true })
        doc.text(total.toFixed(2), margin + 160, currentY, { isInputRtl: true })
        
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
      doc.text('المورد', margin + 50, currentY, { isInputRtl: true })
      doc.text('الكمية', margin + 100, currentY, { isInputRtl: true })
      doc.text('السعر', margin + 130, currentY, { isInputRtl: true })
      doc.text('الإجمالي', margin + 160, currentY, { isInputRtl: true })
      
      // Add line below header
      doc.setLineWidth(0.3)
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      currentY += 8
      
      // Table rows
      doc.setFontSize(9)
      doc.setFont('Amiri', 'normal')
      
      purchases.forEach((purchase: PurchaseItem & { product: any; purchase: any }) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage()
          currentY = margin
        }
        
        const total = purchase.quantity * parseFloat(purchase.price.toString())
        
        doc.text(purchase.purchase.createdAt.toLocaleDateString('ar-SA'), margin, currentY, { isInputRtl: true })
        doc.text(purchase.purchase.supplier?.name || 'مورد نقدي', margin + 50, currentY, { isInputRtl: true })
        doc.text(purchase.quantity.toString(), margin + 100, currentY, { isInputRtl: true })
        doc.text(parseFloat(purchase.price.toString()).toFixed(2), margin + 130, currentY, { isInputRtl: true })
        doc.text(total.toFixed(2), margin + 160, currentY, { isInputRtl: true })
        
        currentY += 6
      })
    }
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    // Sanitize filename to handle Arabic characters
    const sanitizedName = product.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    const filename = `product_movement_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating product movement report PDF:', error)
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
