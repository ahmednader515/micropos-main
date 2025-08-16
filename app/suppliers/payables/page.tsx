'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'

interface Supplier {
  id: string
  name: string
  balance: number
  phone?: string | null
  email?: string | null
  address?: string | null
}

export default function SupplierPayablesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/suppliers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const list: Supplier[] = (data.suppliers || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            balance: typeof s.balance === 'number' ? s.balance : Number(s.balance || 0),
            phone: s.phone ?? null,
            email: s.email ?? null,
            address: s.address ?? null,
          }))
          setSuppliers(list)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSuppliers()
  }, [])

  const payables = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers
      .filter((s) => s.balance > 0) // Only suppliers with positive balance (payables)
      .filter((s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.address ?? '').toLowerCase().includes(q)
      )
  }, [suppliers, search])

  const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function PayablesNavbar() {
    return (
      <div className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-2 py-2 lg:hidden" dir="rtl">
        <button
          onClick={() => window.history.back()}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
          style={{ minWidth: 40 }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="text-[10px] font-medium text-gray-900 truncate">ذمم الموردين - المبالغ المتبقية عند الموردين من الفواتير</h1>
        </div>
        <span className="text-xl px-2">🧾</span>
      </div>
    )
  }

  return (
    <MainLayout hideNavbar={true}>
      <div dir="rtl">
        <PayablesNavbar />

        <div className="max-w-3xl mx-auto mt-4">
          <div className="flex gap-2 items-center mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مورد"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={async () => {
                try {
                  const res = await fetch('/api/reports/suppliers/payables', { method: 'GET' })
                  if (!res.ok) {
                    alert('تعذّر إنشاء التقرير')
                    return
                  }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'supplier_payables.pdf'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('Error downloading PDF:', error)
                  alert('حدث خطأ أثناء تحميل التقرير')
                }
              }}
            >
              تحميل PDF
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">بيانات المورد</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">المبلغ الباقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">جاري التحميل...</td>
                  </tr>
                ) : payables.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">لا توجد بيانات</td>
                  </tr>
                ) : (
                  payables.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-medium text-gray-900">{s.name}</span>
                          <span className="text-xs text-gray-500">
                            {(s.phone ? `هاتف: ${s.phone}` : '')}
                            {s.phone && s.email ? ' • ' : ''}
                            {(s.email ? `بريد: ${s.email}` : '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-red-700 font-semibold text-sm">{formatAmount(s.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


