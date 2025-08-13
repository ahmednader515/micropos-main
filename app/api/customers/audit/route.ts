import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  if (isBuildTime() || isVercelBuild()) {
    return NextResponse.json({ rows: [] })
  }
  try {
    const [customers, sales, payments] = await Promise.all([
      prisma.customer.findMany({}),
      prisma.sale.findMany({ select: { id: true, customerId: true, totalAmount: true, paidAmount: true } }),
      prisma.payment.findMany({ where: { NOT: { customerId: null } } }),
    ])

    const outstandingByCustomer = new Map<string, number>()
    for (const s of sales) {
      if (!s.customerId) continue
      const remain = Number(s.totalAmount) - Number(s.paidAmount)
      if (remain <= 0) continue
      outstandingByCustomer.set(s.customerId, (outstandingByCustomer.get(s.customerId) || 0) + remain)
    }

    const paymentNetByCustomer = new Map<string, number>()
    for (const p of payments) {
      if (!p.customerId) continue
      const amt = Number(p.amount)
      // RECEIVE reduces receivables; PAY increases
      const sign = p.type === 'RECEIVE' ? -1 : 1
      paymentNetByCustomer.set(p.customerId, (paymentNetByCustomer.get(p.customerId) || 0) + sign * amt)
    }

    const rows = customers.map((c) => {
      const outstanding = outstandingByCustomer.get(c.id) || 0
      const paymentAdj = paymentNetByCustomer.get(c.id) || 0
      const computed = outstanding + paymentAdj
      const stored = Number(c.balance || 0)
      const diff = Number((stored - computed).toFixed(2))
      return { id: c.id, name: c.name, stored, computed: Number(computed.toFixed(2)), diff }
    })

    return NextResponse.json({ rows })
  } catch (e) {
    console.error('Customers audit error', e)
    return NextResponse.json({ error: 'Failed to audit' }, { status: 500 })
  }
}


