'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
}

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface DiscountsReportsPopupProps {
  isVisible: boolean
  onClose: () => void
  onReportSelect: (reportType: string, additionalData?: any) => void
  startDate: string
  endDate: string
}

export default function DiscountsReportsPopup({ isVisible, onClose, onReportSelect, startDate, endDate }: DiscountsReportsPopupProps) {
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)
  const [showCustomerPopup, setShowCustomerPopup] = useState(false)
  const [showInvoicePopup, setShowInvoicePopup] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const [customerInput, setCustomerInput] = useState('')
  const [invoiceInput, setInvoiceInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Load categories when category popup opens
  useEffect(() => {
    if (showCategoryPopup && categories.length === 0) {
      loadCategories()
    }
  }, [showCategoryPopup, categories.length])

  // Load customers when customer popup opens
  useEffect(() => {
    if (showCustomerPopup && customers.length === 0) {
      loadCustomers()
    }
  }, [showCustomerPopup, customers.length])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const generatePDF = async (reportType: string, additionalData?: any) => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: startDate,
        endDate: endDate
      })
      
      if (additionalData?.category?.id) {
        params.append('categoryId', additionalData.category.id)
      }
      
      if (additionalData?.customer?.id) {
        params.append('customerId', additionalData.customer.id)
      }
      
      if (additionalData?.categoryName) {
        params.append('categoryName', additionalData.categoryName)
      }
      
      if (additionalData?.customerName) {
        params.append('customerName', additionalData.customerName)
      }
      
      if (additionalData?.invoiceNumber) {
        params.append('invoiceNumber', additionalData.invoiceNumber)
      }
      
      const res = await fetch(`/api/reports/discounts?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const reportTitles: { [key: string]: string } = {
        'by-product': 'discounts_report_by_product',
        'by-category': `discounts_report_by_category_${additionalData?.categoryName || ''}`,
        'by-customer': `discounts_report_by_customer_${additionalData?.customer?.name || additionalData?.customerName || ''}`,
        'by-customer-balances': 'discounts_report_by_customer_balances',
        'by-invoice': `discounts_report_by_invoice_${additionalData?.invoiceNumber || ''}`
      }
      
      a.download = `${reportTitles[reportType] || 'discounts_report'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const handleReportClick = (reportType: string) => {
    if (reportType === 'by-category') {
      onClose()
      setShowCategoryPopup(true)
    } else if (reportType === 'by-customer') {
      onClose()
      setShowCustomerPopup(true)
    } else if (reportType === 'by-invoice') {
      onClose()
      setShowInvoicePopup(true)
    } else {
      generatePDF(reportType)
      onClose()
    }
  }

  const handleCategorySelect = (category: Category) => {
    generatePDF('by-category', { category })
    setShowCategoryPopup(false)
  }

  const handleCustomerSelect = (customer: Customer) => {
    generatePDF('by-customer', { customer })
    setShowCustomerPopup(false)
  }

  const handleCategoryInputSubmit = () => {
    if (categoryInput.trim()) {
      generatePDF('by-category', { categoryName: categoryInput.trim() })
      setShowCategoryPopup(false)
      setCategoryInput('')
    } else {
      alert('يرجى إدخال اسم التصنيف')
    }
  }

  const handleCustomerInputSubmit = () => {
    if (customerInput.trim()) {
      generatePDF('by-customer', { customerName: customerInput.trim() })
      setShowCustomerPopup(false)
      setCustomerInput('')
    } else {
      alert('يرجى إدخال اسم العميل')
    }
  }

  const handleInvoiceInputSubmit = () => {
    if (invoiceInput.trim()) {
      generatePDF('by-invoice', { invoiceNumber: invoiceInput.trim() })
      setShowInvoicePopup(false)
      setInvoiceInput('')
    } else {
      alert('يرجى إدخال رقم الفاتورة')
    }
  }

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  return (
    <>
      {/* Main Discounts Reports Popup */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">تقرير بالخصومات</h2>
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
                onClick={() => handleReportClick('by-product')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالخصومات حسب الصنف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-category')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالخصومات حسب التصنيف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-customer')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالخصومات حسب العميل</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-customer-balances')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالخصومات حسب العميل - من شاشة الذمم</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-invoice')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالخصومات حسب رقم الفاتورة</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Category Selection Popup */}
      {showCategoryPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">اختيار التصنيف</h2>
                <button
                  onClick={() => setShowCategoryPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="ابحث عن التصنيف..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingCategories ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">جاري التحميل...</div>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">لا توجد تصنيفات</div>
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full text-right px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                    >
                      <span>{category.name}</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Popup */}
      {showCustomerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">اختيار العميل</h2>
                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="ابحث عن العميل..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingCustomers ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">جاري التحميل...</div>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">لا يوجد عملاء</div>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-right px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        {customer.phone && (
                          <span className="text-sm text-gray-500">{customer.phone}</span>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Input Popup */}
      {showInvoicePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">إدخال رقم الفاتورة</h2>
                <button
                  onClick={() => {
                    setShowInvoicePopup(false)
                    setInvoiceInput('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الفاتورة
                </label>
                <input
                  type="text"
                  value={invoiceInput}
                  onChange={(e) => setInvoiceInput(e.target.value)}
                  placeholder="أدخل رقم الفاتورة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInvoiceInputSubmit()
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleInvoiceInputSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  إنشاء التقرير
                </button>
                <button
                  onClick={() => {
                    setShowInvoicePopup(false)
                    setInvoiceInput('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
