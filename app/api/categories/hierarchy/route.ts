import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export async function GET() {
  try {
    await prisma.$connect()
    
    // Get all categories with their children and product counts
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
                _count: {
                  select: { products: true }
                }
              }
            },
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      where: {
        parentId: null // Only root categories
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to include product counts
    const transformCategory = (category: any): any => {
      return {
        ...category,
        productCount: category._count.products,
        children: category.children.map(transformCategory)
      }
    }

    const transformedCategories = categories.map(transformCategory)

    await prisma.$disconnect()

    return NextResponse.json({
      categories: transformedCategories
    })
  } catch (error) {
    console.error('Failed to fetch hierarchical categories:', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
