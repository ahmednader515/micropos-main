import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  if (isBuildTime() || isVercelBuild()) {
    return NextResponse.json({ invoices: [], summary: { totalRemaining: 0, count: 0, byCustomer: [] } })
  }
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status') // PENDING, COMPLETED, CANCELLED, REFUNDED

    const where: any = {
      ...(customerId ? { customerId } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const invoices = sales
      .map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customer: s.customer,
        date: s.createdAt,
        total: Number(s.totalAmount),
        paid: Number(s.paidAmount),
        remaining: Number(s.totalAmount) - Number(s.paidAmount),
      }))
      .filter((i) => i.remaining > 0)

    const byCustomerMap = new Map<string, { customerId: string; name: string; remaining: number }>()
    let totalRemaining = 0
    for (const i of invoices) {
      totalRemaining += i.remaining
      if (i.customer) {
        const key = i.customer.id
        const entry = byCustomerMap.get(key) || { customerId: key, name: i.customer.name, remaining: 0 }
        entry.remaining += i.remaining
        byCustomerMap.set(key, entry)
      }
    }

    return NextResponse.json({
      invoices,
      summary: { totalRemaining, count: invoices.length, byCustomer: Array.from(byCustomerMap.values()) },
    })
  } catch (e) {
    console.error('Receivables error', e)
    return NextResponse.json({ error: 'Failed to load receivables' }, { status: 500 })
  }
}


