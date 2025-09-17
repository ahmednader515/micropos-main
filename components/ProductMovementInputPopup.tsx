'use client'

import { useState } from 'react'

interface ProductMovementInputPopupProps {
  isVisible: boolean
  onClose: () => void
  title: string
  apiEndpoint: string
  startDate: string
  endDate: string
}

export default function ProductMovementInputPopup({ isVisible, onClose, title, apiEndpoint, startDate, endDate }: ProductMovementInputPopupProps) {
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) {
      alert('يرجى إدخال اسم المنتج')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        productName: productName.trim(),
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`${apiEndpoint}?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}_${productName.trim()}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      
      onClose()
      setProductName('')
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المنتج
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="أدخل اسم المنتج..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50"
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
