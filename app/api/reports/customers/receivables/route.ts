import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import puppeteer from 'puppeteer'

export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const summary = searchParams.get('summary') === '1'

  try {
    await prisma.$connect()
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    await prisma.$disconnect()

    // Filter customers with positive balance
    const customersWithBalance = customers.filter(c => Number(c.balance) > 0)

    // Create HTML content with proper Arabic text and RTL support
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Receivables Report</title>
        <style>
          @font-face {
            font-family: 'Amiri';
            src: url('data:font/truetype;base64,${(() => {
              try {
                const fontPath = join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf')
                if (existsSync(fontPath)) {
                  const fontData = readFileSync(fontPath)
                  return fontData.toString('base64')
                }
              } catch (error) {
                console.log('Font loading failed:', error)
              }
              return ''
            })()}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          
          body {
            font-family: 'Amiri', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            direction: rtl;
            text-align: right;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          
          .table th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
          }
          
          .table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
            font-size: 12px;
          }
          
          .table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .customer-info {
            margin-bottom: 5px;
          }
          
          .balance {
            font-weight: bold;
            color: #d32f2f;
          }
          
          .summary-note {
            margin-top: 20px;
            padding: 15px;
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            font-size: 14px;
            color: #1976d2;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${summary ? 'ذمم العملاء - تقرير ملخص' : 'ذمم العملاء - المبالغ المتبقية عند العملاء من الفواتير'}</h1>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>${summary ? 'العميل' : 'بيانات العميل'}</th>
              <th>${summary ? 'المتبقي' : 'المبلغ الباقي'}</th>
            </tr>
          </thead>
          <tbody>
            ${customersWithBalance.map(customer => {
              const balance = Number(customer.balance || 0)
              let customerInfo = customer.name || ''
              
              if (!summary && customer.customerNumber) {
                customerInfo += ` - رقم: ${customer.customerNumber}`
              }
              if (!summary && customer.phone) {
                customerInfo += ` - هاتف: ${customer.phone}`
              }
              
              return `
                <tr>
                  <td>
                    <div class="customer-info">${customerInfo}</div>
                  </td>
                  <td class="balance">${balance.toFixed(2)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
        
        ${summary ? `
          <div class="summary-note">
            <strong>ملاحظة:</strong> هذا التقرير يعرض فقط العملاء الذين لديهم مبالغ متبقية (أرصدة موجبة).
          </div>
        ` : ''}
      </body>
      </html>
    `

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Set content and wait for fonts to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    // Generate PDF with proper settings for Arabic text
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    await browser.close()
    
    console.log('PDF generated successfully with Puppeteer, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${summary ? 'customer_receivables_summary' : 'customer_receivables'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
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


