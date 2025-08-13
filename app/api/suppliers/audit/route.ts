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
    const [suppliers, purchases, payments] = await Promise.all([
      prisma.supplier.findMany({}),
      prisma.purchase.findMany({ select: { id: true, supplierId: true, totalAmount: true, paidAmount: true } }),
      prisma.payment.findMany({ where: { NOT: { supplierId: null } } }),
    ])

    const outstandingBySupplier = new Map<string, number>()
    for (const p of purchases) {
      if (!p.supplierId) continue
      const remain = Number(p.totalAmount) - Number(p.paidAmount)
      if (remain <= 0) continue
      outstandingBySupplier.set(p.supplierId, (outstandingBySupplier.get(p.supplierId) || 0) + remain)
    }

    const paymentNetBySupplier = new Map<string, number>()
    for (const pay of payments) {
      if (!pay.supplierId) continue
      const amt = Number(pay.amount)
      // PAY reduces payables; RECEIVE increases
      const sign = pay.type === 'PAY' ? -1 : 1
      paymentNetBySupplier.set(pay.supplierId, (paymentNetBySupplier.get(pay.supplierId) || 0) + sign * amt)
    }

    const rows = suppliers.map((s) => {
      const outstanding = outstandingBySupplier.get(s.id) || 0
      const paymentAdj = paymentNetBySupplier.get(s.id) || 0
      const computed = outstanding + paymentAdj
      const stored = Number(s.balance || 0)
      const diff = Number((stored - computed).toFixed(2))
      return { id: s.id, name: s.name, stored, computed: Number(computed.toFixed(2)), diff }
    })

    return NextResponse.json({ rows })
  } catch (e) {
    console.error('Suppliers audit error', e)
    return NextResponse.json({ error: 'Failed to audit' }, { status: 500 })
  }
}


