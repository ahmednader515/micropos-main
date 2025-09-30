'use client'

import { useState } from 'react'

interface PaymentMethodPopupProps {
  isVisible: boolean
  onClose: () => void
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export default function PaymentMethodPopup({ isVisible, onClose, title, startDate, endDate, startTime, endTime }: PaymentMethodPopupProps) {
  const [selectedMethod, setSelectedMethod] = useState('')

  const paymentMethods = [
    { id: 'cash', name: 'نقدا', value: 'CASH' },
    { id: 'card', name: 'بطاقة', value: 'CARD' },
    { id: 'check', name: 'شيك', value: 'CHECK' }
  ]

  const generatePDF = async (methodValue: string, methodName: string) => {
    try {
      const params = new URLSearchParams({
        paymentMethod: methodValue,
        startDate: `${startDate}T${startTime}:00.000Z`,
        endDate: `${endDate}T${endTime}:59.999Z`
      })
      
      const res = await fetch(`/api/reports/customers/payment-movement?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payment_movement_${methodName}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      
      // Close popup after successful generation
      onClose()
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const handleMethodClick = (methodValue: string, methodName: string) => {
    generatePDF(methodValue, methodName)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
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
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodClick(method.value, method.name)}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">{method.name}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
