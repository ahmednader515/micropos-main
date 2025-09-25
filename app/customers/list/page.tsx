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

  const handleWhatsApp = (customer: CustomerRow) => {
    if (!customer.phone) {
      alert('لا يوجد رقم هاتف للعميل')
      return
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = customer.phone.replace(/[\s\-\(\)]/g, '')
    
    // Add country code if not present (assuming Egypt +20)
    let phoneNumber = cleanPhone
    if (!phoneNumber.startsWith('+20') && !phoneNumber.startsWith('20')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+20' + phoneNumber.substring(1)
      } else {
        phoneNumber = '+20' + phoneNumber
      }
    } else if (phoneNumber.startsWith('20')) {
      phoneNumber = '+' + phoneNumber
    }

    // Create WhatsApp URL
    const message = `مرحباً ${customer.name}،\n\nأتمنى أن تكون بخير. أردت التواصل معك بخصوص حسابك.\n\nشكراً لتعاملك معنا!`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
  }

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
              onClick={async () => {
                try {
                  const res = await fetch('/api/reports/customers/list', { method: 'GET' })
                  if (!res.ok) {
                    alert('تعذّر إنشاء التقرير')
                    return
                  }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'customer_list.pdf'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('Error downloading PDF:', error)
                  alert('حدث خطأ أثناء تحميل التقرير')
                }
              }}
            >
              تقرير
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-right">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-700">بيانات العميل</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-700">رقم الهاتف</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-700">واتساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-2 sm:px-4 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">جاري التحميل...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 sm:px-4 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">لا توجد بيانات</td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-gray-50"
                      >
                        <td 
                          className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => window.location.href = `/customers/${c.id}/edit`}
                        >
                          {c.name}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-800">{formatPhone(c.phone)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          {c.phone ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWhatsApp(c)
                              }}
                              className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                              <span className="hidden sm:inline">واتساب</span>
                              <span className="sm:hidden">واتس</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">لا يوجد رقم</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
