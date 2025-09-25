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

  const handleWhatsApp = (supplier: Supplier) => {
    if (!supplier.phone) {
      alert('لا يوجد رقم هاتف للمورد')
      return
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = supplier.phone.replace(/[\s\-\(\)]/g, '')
    
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
    const message = `مرحباً ${supplier.name}،\n\nأتمنى أن تكون بخير. أردت التواصل معك بخصوص حسابك.\n\nشكراً لتعاملك معنا!`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
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
              {pdfLoading ? 'جاري الإنشاء...' : 'تقرير'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-right">رقم المورد</th>
                  <th className="px-2 sm:px-3 py-2 text-right">اسم المورد</th>
                  <th className="px-2 sm:px-3 py-2 text-right">رقم الهاتف</th>
                  <th className="px-2 sm:px-3 py-2 text-right hidden sm:table-cell">الرقم الضريبي</th>
                  <th className="px-2 sm:px-3 py-2 text-right hidden sm:table-cell">السجل التجاري</th>
                  <th className="px-2 sm:px-3 py-2 text-right">واتساب</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr 
                    key={c.id} 
                    className="border-t hover:bg-gray-50"
                  >
                    <td 
                      className="px-2 sm:px-3 py-2 cursor-pointer"
                      onClick={() => handleSupplierClick(c)}
                    >
                      {c.supplierNumber || '-'}
                    </td>
                    <td 
                      className="px-2 sm:px-3 py-2 cursor-pointer"
                      onClick={() => handleSupplierClick(c)}
                    >
                      {c.name}
                    </td>
                    <td className="px-2 sm:px-3 py-2">{c.phone || '-'}</td>
                    <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{c.taxRegistration || '-'}</td>
                    <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{c.commercialRegistration || '-'}</td>
                    <td className="px-2 sm:px-3 py-2">
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
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-2 sm:px-3 py-6 text-center" colSpan={6}>لا توجد نتائج</td>
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


