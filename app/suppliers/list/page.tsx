'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'

type Supplier = {
  id: string
  supplierNumber: string | null
  name: string
  phone: string | null
  address: string | null
  taxRegistration: string | null
  commercialRegistration: string | null
  balance: number
}

export default function SuppliersListPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Supplier[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

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
      [c.name, c.phone, c.address, c.taxRegistration, c.commercialRegistration].some((v) => (v || '').toLowerCase().includes(s))
    )
  }, [rows, q])

  const handleSupplierClick = (supplier: Supplier) => {
    router.push(`/suppliers/${supplier.id}/edit`)
  }

  const handlePrintPDF = async () => {
    try {
      setPdfLoading(true)
      const response = await fetch('/api/reports/suppliers/list')
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'supplier_list.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('حدث خطأ أثناء إنشاء ملف PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <MainLayout navbarTitle="عرض الموردين" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        <div className="bg-white p-3 rounded shadow">
          <div className="flex gap-3">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="بحث باسم المورد"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={handlePrintPDF}
              disabled={pdfLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 whitespace-nowrap"
            >
              {pdfLoading ? 'جاري الإنشاء...' : 'تحميل PDF'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">رقم المورد</th>
                  <th className="px-3 py-2 text-right">اسم المورد</th>
                  <th className="px-3 py-2 text-right">رقم الهاتف</th>
                  <th className="px-3 py-2 text-right">الرقم الضريبي</th>
                  <th className="px-3 py-2 text-right">السجل التجاري</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr 
                    key={c.id} 
                    className="border-t hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleSupplierClick(c)}
                  >
                    <td className="px-3 py-2">{c.supplierNumber || '-'}</td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.phone || '-'}</td>
                    <td className="px-3 py-2">{c.taxRegistration || '-'}</td>
                    <td className="px-3 py-2">{c.commercialRegistration || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center" colSpan={5}>لا توجد نتائج</td>
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


