'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

type Row = { id: string; name: string; stored: number; computed: number; diff: number }

export default function CustomersAuditPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/customers/audit')
        const j = await r.json()
        setRows(j.rows || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch('/api/reports/customers/audit', { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'customer_audit.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  return (
    <MainLayout navbarTitle="فحص أرصدة العملاء" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-end">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            تحميل PDF
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">العميل</th>
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


