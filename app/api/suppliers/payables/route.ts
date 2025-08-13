import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  if (isBuildTime() || isVercelBuild()) {
    return NextResponse.json({ bills: [], summary: { totalRemaining: 0, count: 0, bySupplier: [] } })
  }
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status') // PENDING, COMPLETED, CANCELLED, RETURNED

    const where: any = {
      ...(supplierId ? { supplierId } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const bills = purchases
      .map((p) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        supplier: p.supplier,
        date: p.createdAt,
        total: Number(p.totalAmount),
        paid: Number(p.paidAmount),
        remaining: Number(p.totalAmount) - Number(p.paidAmount),
      }))
      .filter((b) => b.remaining > 0)

    const bySupplierMap = new Map<string, { supplierId: string; name: string; remaining: number }>()
    let totalRemaining = 0
    for (const b of bills) {
      totalRemaining += b.remaining
      if (b.supplier) {
        const key = b.supplier.id
        const entry = bySupplierMap.get(key) || { supplierId: key, name: b.supplier.name, remaining: 0 }
        entry.remaining += b.remaining
        bySupplierMap.set(key, entry)
      }
    }

    return NextResponse.json({
      bills,
      summary: { totalRemaining, count: bills.length, bySupplier: Array.from(bySupplierMap.values()) },
    })
  } catch (e) {
    console.error('Payables error', e)
    return NextResponse.json({ error: 'Failed to load payables' }, { status: 500 })
  }
}


