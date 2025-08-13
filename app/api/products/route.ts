import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDatabaseOperation, buildTimeResponses, isBuildTime, isVercelBuild } from '@/lib/api-helpers'

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

export async function POST(request: Request) {
  try {
    await prisma.$connect()
    
    const body = await request.json()
    const {
      name,
      description,
      price,
      price2,
      price3,
      costPrice,
      stock,
      minStock,
      barcode,
      categoryId,
      expiryDate,
      tax,
      unit,
      unitPackage,
      higherPackage,
      color,
      imageUrl,
    } = body

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Name, price, and stock are required' },
        { status: 400 }
      )
    }

    // Check if product name already exists
    const existingProduct = await prisma.product.findUnique({
      where: { name }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      )
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price,
        price2: price2 || 0,
        price3: price3 || 0,
        costPrice: costPrice || 0,
        stock: stock || 0,
        minStock: minStock || 0,
        barcode: barcode || null,
        categoryId: categoryId || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        tax: tax || 0,
        unit: unit || null,
        unitPackage: unitPackage || null,
        higherPackage: higherPackage || null,
        color: color || null,
        imageUrl: imageUrl || null,
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Product created successfully',
      product: {
        ...product,
        price: Number(product.price),
        price2: Number(product.price2),
        price3: Number(product.price3),
        costPrice: Number(product.costPrice)
      }
    })

  } catch (error) {
    console.error('Error creating product:', error)
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
} 