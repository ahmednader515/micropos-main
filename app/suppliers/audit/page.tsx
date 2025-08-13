'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

type Row = { id: string; name: string; stored: number; computed: number; diff: number }

export default function SuppliersAuditPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/suppliers/audit')
        const j = await r.json()
        setRows(j.rows || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <MainLayout navbarTitle="فحص أرصدة الموردين" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">المورد</th>
                  <th className="px-3 py-2 text-right">الرصيد المخزن</th>
                  <th className="px-3 py-2 text-right">الرصيد المحسوب</th>
                  <th className="px-3 py-2 text-right">الفرق</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{Number(r.stored).toFixed(2)}</td>
                    <td className="px-3 py-2">{Number(r.computed).toFixed(2)}</td>
                    <td className={`px-3 py-2 ${r.diff === 0 ? '' : r.diff > 0 ? 'text-green-700' : 'text-red-700'}`}>{Number(r.diff).toFixed(2)}</td>
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


