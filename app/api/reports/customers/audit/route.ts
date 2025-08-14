import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    await prisma.$disconnect()

    // Create HTML content with proper Arabic text and RTL support
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Audit Report</title>
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
            color: #2c5aa0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">فحص أرصدة العملاء</h1>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>العميل</th>
              <th>الرصيد الحالي</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(customer => {
              const balance = Number(customer.balance || 0)
              let customerInfo = customer.name || ''
              
              if (customer.customerNumber) {
                customerInfo += ` - رقم: ${customer.customerNumber}`
              }
              if (customer.phone) {
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
      </body>
      </html>
    `

    // Detect environment and set appropriate Puppeteer options
    const isVercel = process.env.VERCEL === '1'
    const isProduction = process.env.NODE_ENV === 'production'
    
    console.log('Environment detected:', { isVercel, isProduction })
    
    // Launch Puppeteer with environment-optimized settings
    let browser
    try {
      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-software-rasterizer',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--disable-component-extensions-with-background-pages',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        timeout: isVercel ? 25000 : 30000, // Respect Vercel's 30s limit
        protocolTimeout: isVercel ? 25000 : 30000,
        ignoreDefaultArgs: ['--disable-extensions'],
        executablePath: process.env.CHROME_BIN || undefined
      }
      
      console.log('Launching Puppeteer with options:', launchOptions)
      browser = await puppeteer.launch(launchOptions)
      
    } catch (launchError) {
      console.error('Failed to launch browser with primary options:', launchError)
      
      // Fallback: try with minimal options
      try {
        console.log('Trying fallback launch options...')
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          timeout: isVercel ? 25000 : 30000
        })
      } catch (fallbackError) {
        console.error('Failed to launch browser with fallback options:', fallbackError)
        
        // Final fallback: try with absolute minimal options
        try {
          console.log('Trying final fallback with minimal options...')
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            timeout: isVercel ? 20000 : 25000
          })
        } catch (finalError) {
          console.error('All browser launch attempts failed:', finalError)
          throw new Error(`Browser launch failed after all attempts: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`)
        }
      }
    }
    
    if (!browser) {
      throw new Error('Browser failed to launch')
    }

    console.log('Browser launched successfully')
    const page = await browser.newPage()
    
    // Set viewport and user agent for better compatibility
    await page.setViewport({ width: 1200, height: 800 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    // Set content and wait for fonts to load
    console.log('Setting page content...')
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    // Wait a bit more for fonts to render properly
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Generating PDF...')
    // Generate PDF with proper settings for Arabic text
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      timeout: isVercel ? 25000 : 30000
    })
    
    await browser.close()
    
    console.log('PDF generated successfully with Puppeteer, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="customer_audit.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Provide more detailed error information
    let errorMessage = 'PDF generation failed'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    } else if (typeof error === 'string') {
      errorMessage = error
      errorDetails = error
    }
    
    return new NextResponse(JSON.stringify({ 
      error: errorMessage, 
      details: errorDetails,
      timestamp: new Date().toISOString(),
      environment: {
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}


