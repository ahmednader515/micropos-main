import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🧪 Testing Accelerate connection...')
    
    // Simple test query
    const result = await prisma.customer.count()
    
    console.log('✅ Accelerate test successful, customer count:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Accelerate connection working',
      customerCount: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Accelerate test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Accelerate connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
