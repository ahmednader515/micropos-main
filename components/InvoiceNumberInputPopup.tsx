'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface InvoiceNumberInputPopupProps {
  isVisible: boolean
  onClose: () => void
  title?: string
  placeholder?: string
  onSubmit: (invoiceNumber: string) => void
}

export default function InvoiceNumberInputPopup({ isVisible, onClose, title = 'إدخال رقم الفاتورة', placeholder = 'أدخل رقم الفاتورة...', onSubmit }: InvoiceNumberInputPopupProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = invoiceNumber.trim()
    if (!trimmed) {
      alert('يرجى إدخال رقم الفاتورة')
      return
    }
    onSubmit(trimmed)
    setInvoiceNumber('')
  }

  if (!isVisible || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={() => {
                onClose()
                setInvoiceNumber('')
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
                رقم الفاتورة
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Allow form submit via Enter
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                متابعة
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  setInvoiceNumber('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}


