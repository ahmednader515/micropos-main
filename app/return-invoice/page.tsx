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

export default function ReturnInvoicePage() {
  const [returnType, setReturnType] = useState<'invoice' | 'product'>('invoice')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [deductFromCashbox, setDeductFromCashbox] = useState<'yes' | 'no'>('no')
  const [returnDate, setReturnDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasLoadedFromURL, setHasLoadedFromURL] = useState(false)

  const handleViewInvoice = async (invoiceNum?: string) => {
    const invoiceToSearch = invoiceNum || invoiceNumber
    if (!invoiceToSearch.trim()) {
      alert('يرجى إدخال رقم الفاتورة')
      return
    }

    setLoading(true)
    try {
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

  // Set default return date to today and load invoice from URL
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setReturnDate(today)
    
    // Check for invoice parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const invoiceParam = urlParams.get('invoice')
    if (invoiceParam && !hasLoadedFromURL) {
      setInvoiceNumber(invoiceParam)
      setHasLoadedFromURL(true)
      handleViewInvoice(invoiceParam)
    }
  }, [hasLoadedFromURL])

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

  const handleReturn = () => {
    if (!selectedInvoice) {
      alert('يرجى عرض الفاتورة أولاً')
      return
    }

    if (!returnDate) {
      alert('يرجى اختيار تاريخ الإرجاع')
      return
    }

    // TODO: Implement return logic
    console.log('Return invoice:', {
      returnType,
      invoice: selectedInvoice,
      deductFromCashbox,
      returnDate,
      note
    })

    alert('تم إرسال طلب الإرجاع')
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(Number(amount))
  }

  const calculateRemainingAmount = () => {
    if (!selectedInvoice) return 0
    return Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)
  }

  const calculateCustomerBalance = () => {
    if (!selectedInvoice?.customer) return 0
    const currentBalance = Number(selectedInvoice.customer.balance)
    const remainingAmount = calculateRemainingAmount()
    return currentBalance + remainingAmount
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
            <h1 className="text-lg font-semibold text-gray-900">إرجاع الفاتورة</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="hidden lg:block text-2xl font-bold text-gray-900 mb-6">إرجاع الفاتورة</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Return Type Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">نوع الإرجاع</h3>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="returnType"
                    value="invoice"
                    checked={returnType === 'invoice'}
                    onChange={(e) => setReturnType(e.target.value as 'invoice' | 'product')}
                    className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">إرجاع الفاتورة</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="returnType"
                    value="product"
                    checked={returnType === 'product'}
                    onChange={(e) => setReturnType(e.target.value as 'invoice' | 'product')}
                    className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">إرجاع منتج</span>
                </label>
              </div>
            </div>

            {/* Invoice Number */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">رقم الفاتورة</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="أدخل رقم الفاتورة"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleViewInvoice}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
                >
                  {loading ? 'جاري التحميل...' : 'عرض'}
                </button>
              </div>
            </div>

            {/* Invoice Details */}
            {selectedInvoice && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الفاتورة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي الفاتورة</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </div>
                  </div>

                  {/* Paid Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المدفوع للفاتورة</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {formatCurrency(selectedInvoice.paidAmount)}
                    </div>
                  </div>

                  {/* Deduct from Cashbox */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خصم المبلغ من الصندوق</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="deductFromCashbox"
                          value="yes"
                          checked={deductFromCashbox === 'yes'}
                          onChange={(e) => setDeductFromCashbox(e.target.value as 'yes' | 'no')}
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700">نعم</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="deductFromCashbox"
                          value="no"
                          checked={deductFromCashbox === 'no'}
                          onChange={(e) => setDeductFromCashbox(e.target.value as 'yes' | 'no')}
                          className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700">لا</span>
                      </label>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {selectedInvoice.customer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">هذه الفاتورة للعميل</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {selectedInvoice.customer.name}
                      </div>
                    </div>
                  )}

                  {/* Customer Balance */}
                  {selectedInvoice.customer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي الباقي عند العميل</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {formatCurrency(calculateCustomerBalance())}
                      </div>
                    </div>
                  )}

                  {/* Remaining Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الباقي من المدفوع للفاتورة [يضاف الباقي لرصيد العميل]</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {formatCurrency(calculateRemainingAmount())}
                    </div>
                  </div>

                  {/* Return Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الإرجاع</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Note */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظة</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="أدخل ملاحظة حول الإرجاع"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Return Button */}
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={handleReturn}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold"
                  >
                    إرجاع
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
