'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'

interface CustomerRow {
  id: string
  name: string
  phone: string | null
}

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/customers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const rows: CustomerRow[] = (data.customers || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone ?? null,
          }))
          setCustomers(rows)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q))
  }, [customers, search])

  function Navbar() {
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
          <h1 className="text-xs font-medium text-gray-900 truncate">عرض العملاء</h1>
        </div>
        <span className="text-xl px-2">👥</span>
      </div>
    )
  }

  const formatPhone = (p: string | null) => (p && p.trim() ? p : '-')

  return (
    <MainLayout hideNavbar={true}>
      <div dir="rtl">
        <Navbar />

        <div className="max-w-3xl mx-auto mt-4">
          <div className="flex gap-2 items-center mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العميل"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={() => alert('تقارير')}
            >
              تقرير
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">بيانات العميل</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">رقم الهاتف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">جاري التحميل...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">لا توجد بيانات</td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatPhone(c.phone)}</td>
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
