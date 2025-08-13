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
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'هذا التصنيف موجود بالفعل' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? String(description) : null,
      },
    })

    await prisma.$disconnect()
    return NextResponse.json({ message: 'تم إنشاء التصنيف', category })
  } catch (error) {
    console.error('Failed to create category', error)
    return NextResponse.json({ error: 'فشل إنشاء التصنيف' }, { status: 500 })
  }
}