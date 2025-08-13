'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

type Supplier = { id: string; name: string; balance: number }

export default function SupplierBalancesPage() {
  const [rows, setRows] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/suppliers')
        const j = await r.json()
        setRows((j.suppliers || []).map((c: any) => ({ id: c.id, name: c.name, balance: Number(c.balance || 0) })))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <MainLayout navbarTitle="الأرصدة الافتتاحية والمبالغ النقدية للموردين" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">المورد</th>
                  <th className="px-3 py-2 text-right">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}


