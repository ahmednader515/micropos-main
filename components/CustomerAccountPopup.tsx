'use client'

import { useState } from 'react'

interface CustomerAccountPopupProps {
  isVisible: boolean
  onClose: () => void
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export default function CustomerAccountPopup({ isVisible, onClose, startDate, endDate, startTime, endTime }: CustomerAccountPopupProps) {
  const [customerName, setCustomerName] = useState('')

  const generateCustomerAccountPDF = async () => {
    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل')
      return
    }

    try {
      const params = new URLSearchParams({
        customerName: customerName.trim(),
        startDate: `${startDate}T${startTime}:00.000Z`,
        endDate: `${endDate}T${endTime}:59.999Z`
      })
      
      const res = await fetch(`/api/reports/customers/account?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customer_account_${customerName.trim()}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      
      // Close popup after successful generation
      onClose()
      setCustomerName('')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateCustomerAccountPDF()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">كشف حساب عميل</h2>
            <button
              onClick={() => {
                onClose()
                setCustomerName('')
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العميل
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسم العميل..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                إنشاء التقرير
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  setCustomerName('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
