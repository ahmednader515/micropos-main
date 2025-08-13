import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDatabaseOperation, buildTimeResponses, isVercelBuild } from '@/lib/api-helpers'

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Immediate return for Vercel builds
  if (isVercelBuild()) {
    return NextResponse.json(buildTimeResponses.products)
  }

  return safeDatabaseOperation(
    async () => {
      await prisma.$connect()
      
      const products = await prisma.product.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      await prisma.$disconnect()

      return {
        products: products.map(product => ({
          ...product,
          price: Number(product.price),
          costPrice: Number(product.costPrice)
        }))
      }
    },
    buildTimeResponses.products,
    'Failed to fetch products'
  )
} 