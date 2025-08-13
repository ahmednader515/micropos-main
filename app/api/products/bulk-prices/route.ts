import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild } from '@/lib/api-helpers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

type BulkPricePayload = {
  mode: 'percent' | 'fixed' | 'exchangeRate'
  amount: number
  direction?: 'increase' | 'decrease'
  targets?: Array<'price' | 'price2' | 'price3' | 'costPrice'>
  categoryId?: string | null
  onlyActive?: boolean
}

export async function POST(request: Request) {
  if (isBuildTime() || isVercelBuild()) {
    return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as BulkPricePayload
    const { mode, amount, direction, targets = ['price'], categoryId, onlyActive = true } = body

    if (!mode || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'المعاملات مطلوبة: الوضع والقيمة' }, { status: 400 })
    }
    if ((mode === 'percent' || mode === 'fixed') && !direction) {
      return NextResponse.json({ error: 'مطلوب الاتجاه لعمليات النسبة أو القيمة الثابتة' }, { status: 400 })
    }

    if (amount < 0) {
      return NextResponse.json({ error: 'القيمة يجب أن تكون موجبة' }, { status: 400 })
    }

    await prisma.$connect()

    const products = await prisma.product.findMany({
      where: {
        ...(onlyActive ? { isActive: true } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      select: {
        id: true,
        price: true,
        price2: true,
        price3: true,
        costPrice: true,
      },
    })

    if (products.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json({ updated: 0 })
    }

    const sign = direction === 'increase' ? 1 : -1

    const updates = products.map((p) => {
      const next: Record<string, number> = {}
      const apply = (current: any) => {
        const currentNum = Number(current || 0)
        if (mode === 'exchangeRate') {
          return Number((currentNum * amount).toFixed(2))
        }
        if (mode === 'percent') {
          return Number((currentNum + sign * (currentNum * (amount / 100))).toFixed(2))
        }
        return Number((currentNum + sign * amount).toFixed(2))
      }
      if (targets.includes('price')) next.price = apply(p.price)
      if (targets.includes('price2')) next.price2 = apply(p.price2)
      if (targets.includes('price3')) next.price3 = apply(p.price3)
      if (targets.includes('costPrice')) next.costPrice = apply(p.costPrice)
      return prisma.product.update({ where: { id: p.id }, data: next })
    })

    const results = await prisma.$transaction(updates)
    await prisma.$disconnect()

    return NextResponse.json({ updated: results.length })
  } catch (error) {
    console.error('Bulk price update failed', error)
    return NextResponse.json({ error: 'فشل تعديل الأسعار' }, { status: 500 })
  }
}


