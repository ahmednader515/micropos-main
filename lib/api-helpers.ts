import { NextResponse } from 'next/server'

// Helper function to check if we're in a build-time environment
export function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL
}

// Helper function to check if we're in Vercel build environment
// Runtime on Vercel should NOT be treated as build-time. Only skip DB at actual build time.
export function isVercelBuild(): boolean {
  return false
}

// Helper function to return build-time safe responses
export function buildTimeResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

// Helper function to handle database operations safely
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  fallbackData: T,
  errorMessage: string = 'Database operation failed'
): Promise<NextResponse> {
  // If we're in build time or Vercel build, return fallback immediately
  if (isBuildTime() || isVercelBuild()) {
    return buildTimeResponse(fallbackData)
  }

  try {
    const result = await operation()
    return NextResponse.json(result)
  } catch (error) {
    console.error(errorMessage, error)
    
    // If we're in build time or database is unavailable, return fallback
    if (isBuildTime() || isVercelBuild()) {
      return buildTimeResponse(fallbackData)
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Common response patterns
export const buildTimeResponses = {
  products: { products: [] },
  categories: { categories: [] },
  sales: { sales: [] },
  purchases: { purchases: [] },
  customers: { customers: [] },
  suppliers: { suppliers: [] },
  expenses: { expenses: [] },
  transactions: { transactions: [] },
  error: { error: 'Database not available' }
} 