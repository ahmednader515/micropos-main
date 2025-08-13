'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'

type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  balance: number
}

export default function SuppliersListPage() {
  const [rows, setRows] = useState<Supplier[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/suppliers')
        const j = await r.json()
        setRows(j.suppliers || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((c) =>
      [c.name, c.email, c.phone, c.address].some((v) => (v || '').toLowerCase().includes(s))
    )
  }, [rows, q])

  return (
    <MainLayout navbarTitle="عرض الموردين" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        <div className="bg-white p-3 rounded shadow">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="بحث بالاسم أو الهاتف أو البريد"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">الاسم</th>
                  <th className="px-3 py-2 text-right">الهاتف</th>
                  <th className="px-3 py-2 text-right">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.phone || '-'}</td>
                    <td className="px-3 py-2">{Number(c.balance || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center" colSpan={3}>لا توجد نتائج</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}


