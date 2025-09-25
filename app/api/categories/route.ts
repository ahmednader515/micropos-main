import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDatabaseOperation, buildTimeResponses, isVercelBuild, isBuildTime } from '@/lib/api-helpers'

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return safeDatabaseOperation(
    async () => {
      await prisma.$connect()
      
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      await prisma.$disconnect()

      return {
        categories
      }
    },
    buildTimeResponses.categories,
    'Failed to fetch categories'
  )
} 

export async function POST(request: Request) {
  try {
    await prisma.$connect()

    const body = await request.json()
    const { name, description, parentId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 })
    }

    // Check if category with same name exists under the same parent
    const existing = await prisma.category.findFirst({ 
      where: { 
        name: name.trim(),
        parentId: parentId || null
      } 
    })
    if (existing) {
      return NextResponse.json({ error: 'هذا التصنيف موجود بالفعل في نفس المستوى' }, { status: 400 })
    }

    // Calculate level and path
    let level = 0
    let path = name.trim()
    
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'التصنيف الأب غير موجود' }, { status: 400 })
      }
      level = parent.level + 1
      path = parent.path ? `${parent.path}/${name.trim()}` : `${parent.name}/${name.trim()}`
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? String(description) : null,
        parentId: parentId || null,
        level,
        path
      },
    })

    await prisma.$disconnect()
    return NextResponse.json({ message: 'تم إنشاء التصنيف', category })
  } catch (error) {
    console.error('Failed to create category', error)
    return NextResponse.json({ error: 'فشل إنشاء التصنيف' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await prisma.$connect()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف التصنيف مطلوب' }, { status: 400 })
    }

    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
    }

    // Delete the category
    await prisma.category.delete({ where: { id } })

    await prisma.$disconnect()
    return NextResponse.json({ message: 'تم حذف التصنيف' })
  } catch (error) {
    console.error('Failed to delete category', error)
    return NextResponse.json({ error: 'فشل حذف التصنيف' }, { status: 500 })
  }
}