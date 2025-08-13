import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, buildTimeResponses } from '@/lib/api-helpers'

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (isBuildTime()) {
    return NextResponse.json(
      buildTimeResponses.error,
      { status: 503 }
    )
  }

  try {
    await prisma.$connect()
    
    const { id } = params
    const body = await request.json()

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        price: Number(updatedProduct.price),
        costPrice: Number(updatedProduct.costPrice)
      }
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (isBuildTime()) {
      return NextResponse.json(
        buildTimeResponses.error,
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (isBuildTime()) {
    return NextResponse.json(
      buildTimeResponses.error,
      { status: 503 }
    )
  }

  try {
    await prisma.$connect()
    
    const { id } = params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    
    if (isBuildTime()) {
      return NextResponse.json(
        buildTimeResponses.error,
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
} 