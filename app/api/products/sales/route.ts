import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDatabaseOperation, buildTimeResponses } from '@/lib/api-helpers'

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return safeDatabaseOperation(
    async () => {
      await prisma.$connect()
      
      const products = await prisma.product.findMany({
        where: {
          isActive: true
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
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
    'Failed to fetch products for sales'
  )
} 