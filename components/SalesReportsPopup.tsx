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

interface SalesReportsPopupProps {
  isVisible: boolean
  onClose: () => void
  onReportSelect: (reportType: string, additionalData?: any) => void
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export default function SalesReportsPopup({ isVisible, onClose, onReportSelect, startDate, endDate, startTime, endTime }: SalesReportsPopupProps) {
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)
  const [showCustomerPopup, setShowCustomerPopup] = useState(false)
  const [showCategoryInputPopup, setShowCategoryInputPopup] = useState(false)
  const [showCustomerInputPopup, setShowCustomerInputPopup] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const [customerInput, setCustomerInput] = useState('')
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
        startDate: `${startDate}T${startTime}:00.000Z`,
        endDate: `${endDate}T${endTime}:59.999Z`
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
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const reportTitles: { [key: string]: string } = {
        'period': 'sales_report_period',
        'by-product': 'sales_report_by_product',
        'by-category': 'sales_report_by_category',
        'category': `sales_report_category_${additionalData?.category?.name || ''}`,
        'cash': 'sales_report_cash',
        'credit': 'sales_report_credit',
        'card': 'sales_report_card',
        'check': 'sales_report_check',
        'all': 'sales_report_all',
        'customer': `sales_report_customer_${additionalData?.customer?.name || ''}`
      }
      
      a.download = `${reportTitles[reportType] || 'sales_report'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const handleReportClick = (reportType: string) => {
    if (reportType === 'category') {
      onClose()
      setShowCategoryPopup(true)
    } else if (reportType === 'customer') {
      onClose()
      setShowCustomerInputPopup(true)
    } else if (reportType === 'by-category') {
      onClose()
      setShowCategoryInputPopup(true)
    } else {
      generatePDF(reportType)
      onClose()
    }
  }

  const handleCategorySelect = (category: Category) => {
    generatePDF('category', { category })
    setShowCategoryPopup(false)
  }

  const handleCustomerSelect = (customer: Customer) => {
    generatePDF('customer', { customer })
    setShowCustomerPopup(false)
  }

  const handleCategoryInputSubmit = () => {
    if (categoryInput.trim()) {
      generatePDF('by-category', { categoryName: categoryInput.trim() })
      setShowCategoryInputPopup(false)
      setCategoryInput('')
    } else {
      alert('يرجى إدخال اسم التصنيف')
    }
  }

  const handleCustomerInputSubmit = () => {
    if (customerInput.trim()) {
      generatePDF('customer', { customerName: customerInput.trim() })
      setShowCustomerInputPopup(false)
      setCustomerInput('')
    } else {
      alert('يرجى إدخال اسم العميل')
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
      {/* Main Sales Reports Popup */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">تقرير بالمبيعات</h2>
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
                onClick={() => handleReportClick('period')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات لفترة</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-product')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات حسب الصنف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-category')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات حسب التصنيف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('category')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات لتصنيف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('cash')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات النقد</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('credit')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات الاجل</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('card')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات (بطاقة)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('check')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات (شيك)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('all')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات (الكل)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('customer')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمبيعات حسب العميل</span>
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

      {/* Category Input Popup */}
      {showCategoryInputPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">إدخال اسم التصنيف</h2>
                <button
                  onClick={() => {
                    setShowCategoryInputPopup(false)
                    setCategoryInput('')
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
                  اسم التصنيف
                </label>
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="أدخل اسم التصنيف..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCategoryInputSubmit()
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCategoryInputSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  إنشاء التقرير
                </button>
                <button
                  onClick={() => {
                    setShowCategoryInputPopup(false)
                    setCategoryInput('')
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

      {/* Customer Input Popup */}
      {showCustomerInputPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">إدخال اسم العميل</h2>
                <button
                  onClick={() => {
                    setShowCustomerInputPopup(false)
                    setCustomerInput('')
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
                  اسم العميل
                </label>
                <input
                  type="text"
                  value={customerInput}
                  onChange={(e) => setCustomerInput(e.target.value)}
                  placeholder="أدخل اسم العميل..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomerInputSubmit()
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCustomerInputSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  إنشاء التقرير
                </button>
                <button
                  onClick={() => {
                    setShowCustomerInputPopup(false)
                    setCustomerInput('')
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
