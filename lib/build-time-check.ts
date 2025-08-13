// Build-time environment detection
export function isBuildEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    !process.env.DATABASE_URL
  )
}

// Safe response for build-time environments
export function getBuildTimeResponse(data: any) {
  return {
    ...data,
    _buildTime: true,
    _timestamp: new Date().toISOString()
  }
}

// Common build-time responses
export const buildTimeData = {
  categories: { categories: [] },
  products: { products: [] },
  sales: { sales: [] },
  purchases: { purchases: [] },
  customers: { customers: [] },
  suppliers: { suppliers: [] },
  expenses: { expenses: [] },
  transactions: { transactions: [] },
  error: { error: 'Service temporarily unavailable during build' }
} 