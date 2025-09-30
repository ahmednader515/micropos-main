'use client'

import { useState } from 'react'

interface SupplierPaymentMethodPopupProps {
  isVisible: boolean
  onClose: () => void
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export default function SupplierPaymentMethodPopup({ isVisible, onClose, title, startDate, endDate, startTime, endTime }: SupplierPaymentMethodPopupProps) {
  const [loading, setLoading] = useState(false)

  const generatePDF = async (paymentMethod: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        paymentMethod: paymentMethod,
        startDate: `${startDate}T${startTime}:00.000Z`,
        endDate: `${endDate}T${endTime}:59.999Z`
      })
      
      const res = await fetch(`/api/reports/suppliers/payment-movement?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const methodNames: { [key: string]: string } = {
        'CASH': 'نقدا',
        'CARD': 'بطاقة',
        'CHECK': 'شيك'
      }
      
      a.download = `supplier_payment_movement_${methodNames[paymentMethod] || paymentMethod}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => generatePDF('CASH')}
              disabled={loading}
              className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">نقدا</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => generatePDF('CARD')}
              disabled={loading}
              className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">بطاقة</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => generatePDF('CHECK')}
              disabled={loading}
              className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">شيك</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
