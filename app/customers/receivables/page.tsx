'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'

interface Customer {
  id: string
  name: string
  balance: number
  phone?: string | null
  barcode?: string | null
  customerNumber?: string | null
}

export default function CustomerReceivablesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/customers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const list: Customer[] = (data.customers || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            balance: typeof c.balance === 'number' ? c.balance : Number(c.balance || 0),
            phone: c.phone ?? null,
            barcode: c.barcode ?? null,
            customerNumber: c.customerNumber ?? null,
          }))
          setCustomers(list)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const receivables = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers
      .filter((c) => c.balance > 0) // Only customers with positive balance (receivables)
      .filter((c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.barcode ?? '').toLowerCase().includes(q) ||
        (c.customerNumber ?? '').toLowerCase().includes(q)
      )
  }, [customers, search])

  const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function ReceivablesNavbar() {
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
          <h1 className="text-[10px] font-medium text-gray-900 truncate">ذمم العملاء - المبالغ المتبقية عند العملاء من الفواتير</h1>
        </div>
        <span className="text-xl px-2">🧾</span>
      </div>
    )
  }

  return (
    <MainLayout hideNavbar={true}>
      <div dir="rtl">
        <ReceivablesNavbar />

        <div className="max-w-3xl mx-auto mt-4">
          <div className="flex gap-2 items-center mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن عميل"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={async () => {
                try {
                  const res = await fetch('/api/reports/customers/receivables', { method: 'GET' })
                  if (!res.ok) {
                    alert('تعذّر إنشاء التقرير')
                    return
                  }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'customer_receivables.pdf'
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">بيانات العميل</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">المبلغ الباقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">جاري التحميل...</td>
                  </tr>
                ) : receivables.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">لا توجد بيانات</td>
                  </tr>
                ) : (
                  receivables.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          <span className="text-xs text-gray-500">
                            {(c.customerNumber ? `رقم: ${c.customerNumber}` : '')}
                            {c.customerNumber && c.phone ? ' • ' : ''}
                            {(c.phone ? `هاتف: ${c.phone}` : '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-semibold text-sm">{formatAmount(c.balance)}</td>
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
