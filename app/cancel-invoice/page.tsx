'use client'

import { useState, useEffect } from 'react'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: string
  paidAmount: string
  paymentMethod: string
  createdAt: string
  customer?: {
    id: string
    name: string
    balance: string
  }
  items: {
    id: string
    quantity: number
    price: string
    product: {
      name: string
    }
  }[]
}

export default function CancelInvoicePage() {
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchases'>('sales')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for invoice parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const invoiceParam = urlParams.get('invoice')
    if (invoiceParam) {
      setInvoiceNumber(invoiceParam)
      handleViewInvoice(invoiceParam)
    }
  }, [])

  const handleViewInvoice = async (invoiceNum?: string) => {
    const invoiceToSearch = invoiceNum || invoiceNumber
    if (!invoiceToSearch.trim()) {
      alert('يرجى إدخال رقم الفاتورة')
      return
    }

    setLoading(true)
    try {
      // For now, we'll use the sales API. In the future, you might have separate APIs for sales and purchases
      const response = await fetch(`/api/sales?invoiceNumber=${invoiceToSearch}`)
      if (response.ok) {
        const data = await response.json()
        const invoices = Array.isArray(data) ? data : (data.sales || [])
        
        if (invoices.length > 0) {
          setSelectedInvoice(invoices[0])
        } else {
          alert('لم يتم العثور على الفاتورة')
          setSelectedInvoice(null)
        }
      } else {
        alert('خطأ في جلب الفاتورة')
        setSelectedInvoice(null)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      alert('خطأ في جلب الفاتورة')
      setSelectedInvoice(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePrintInvoice = async () => {
    if (!selectedInvoice) {
      alert('يرجى عرض الفاتورة أولاً')
      return
    }

    try {
      const response = await fetch(`/api/pdf/invoice?id=${selectedInvoice.id}`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${selectedInvoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error printing invoice:', error)
      alert('خطأ في طباعة الفاتورة')
    }
  }

  const handleCancelInvoice = () => {
    if (!selectedInvoice) {
      alert('يرجى عرض الفاتورة أولاً')
      return
    }

    // TODO: Implement cancel invoice logic
    console.log('Cancel invoice:', {
      type: invoiceType,
      invoice: selectedInvoice
    })

    alert('تم إلغاء الفاتورة')
  }

  const formatCurrency = (amount: string | number) => {
    const englishNumerals = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${englishNumerals} ج.م`
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">إلغاء الفاتورة</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="hidden lg:block text-2xl font-bold text-gray-900 mb-6">إلغاء الفاتورة</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Invoice Type Selection */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">نوع الفاتورة</h3>
              <div className="flex gap-2 sm:gap-4">
                <label className="flex items-center p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="sales"
                    checked={invoiceType === 'sales'}
                    onChange={(e) => setInvoiceType(e.target.value as 'sales' | 'purchases')}
                    className="ml-2 sm:ml-3 h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700 text-xs sm:text-sm">فاتورة مبيعات</span>
                </label>
                <label className="flex items-center p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="purchases"
                    checked={invoiceType === 'purchases'}
                    onChange={(e) => setInvoiceType(e.target.value as 'sales' | 'purchases')}
                    className="ml-2 sm:ml-3 h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700 text-xs sm:text-sm">فاتورة مشتريات</span>
                </label>
              </div>
            </div>

            {/* Invoice Number */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">رقم الفاتورة</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="أدخل رقم الفاتورة"
                  className="flex-1 px-2 sm:px-3 py-2 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <button
                  onClick={() => handleViewInvoice()}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-xs sm:text-sm whitespace-nowrap font-medium flex items-center gap-1"
                >
                  {loading && (
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  عرض
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            {selectedInvoice && (
              <div className="pt-4 sm:pt-6 border-t">
                <button
                  onClick={handleCancelInvoice}
                  className="w-full px-4 sm:px-6 py-3 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-base sm:text-lg font-semibold"
                >
                  إلغاء الفاتورة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
