'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
  phone: string | null
}

interface PurchasesReportsPopupProps {
  isVisible: boolean
  onClose: () => void
  onReportSelect: (reportType: string, additionalData?: any) => void
  startDate: string
  endDate: string
}

export default function PurchasesReportsPopup({ isVisible, onClose, onReportSelect, startDate, endDate }: PurchasesReportsPopupProps) {
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)
  const [showSupplierPopup, setShowSupplierPopup] = useState(false)
  const [showCategoryInputPopup, setShowCategoryInputPopup] = useState(false)
  const [showSupplierInputPopup, setShowSupplierInputPopup] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const [supplierInput, setSupplierInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Load categories when category popup opens
  useEffect(() => {
    if (showCategoryPopup && categories.length === 0) {
      loadCategories()
    }
  }, [showCategoryPopup, categories.length])

  // Load suppliers when supplier popup opens
  useEffect(() => {
    if (showSupplierPopup && suppliers.length === 0) {
      loadSuppliers()
    }
  }, [showSupplierPopup, suppliers.length])

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

  const loadSuppliers = async () => {
    setLoadingSuppliers(true)
    try {
      const res = await fetch('/api/suppliers', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoadingSuppliers(false)
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
      
      if (additionalData?.supplier?.id) {
        params.append('supplierId', additionalData.supplier.id)
      }
      
      if (additionalData?.categoryName) {
        params.append('categoryName', additionalData.categoryName)
      }
      
      if (additionalData?.supplierName) {
        params.append('supplierName', additionalData.supplierName)
      }
      
      const res = await fetch(`/api/reports/purchases?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const reportTitles: { [key: string]: string } = {
        'period': 'purchases_report_period',
        'by-product': 'purchases_report_by_product',
        'by-category': `purchases_report_by_category_${additionalData?.categoryName || ''}`,
        'category': `purchases_report_category_${additionalData?.category?.name || ''}`,
        'cash': 'purchases_report_cash',
        'credit': 'purchases_report_credit',
        'card': 'purchases_report_card',
        'check': 'purchases_report_check',
        'all': 'purchases_report_all',
        'supplier': `purchases_report_supplier_${additionalData?.supplier?.name || additionalData?.supplierName || ''}`
      }
      
      a.download = `${reportTitles[reportType] || 'purchases_report'}.pdf`
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
    } else if (reportType === 'supplier') {
      onClose()
      setShowSupplierInputPopup(true)
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

  const handleSupplierSelect = (supplier: Supplier) => {
    generatePDF('supplier', { supplier })
    setShowSupplierPopup(false)
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

  const handleSupplierInputSubmit = () => {
    if (supplierInput.trim()) {
      generatePDF('supplier', { supplierName: supplierInput.trim() })
      setShowSupplierInputPopup(false)
      setSupplierInput('')
    } else {
      alert('يرجى إدخال اسم المورد')
    }
  }

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  return (
    <>
      {/* Main Purchases Reports Popup */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">تقرير بالمشتريات</h2>
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
                <span className="text-sm">تقرير بالمشتريات لفترة</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-product')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات حسب الصنف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('by-category')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات حسب التصنيف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('category')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات لتصنيف</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('cash')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات النقد</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('credit')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات الاجل</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('card')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات (بطاقة)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('check')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات (شيك)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('all')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات (الكل)</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleReportClick('supplier')}
                className="w-full text-right px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-sm">تقرير بالمشتريات حسب المورد</span>
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

      {/* Supplier Input Popup */}
      {showSupplierInputPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">إدخال اسم المورد</h2>
                <button
                  onClick={() => {
                    setShowSupplierInputPopup(false)
                    setSupplierInput('')
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
                  اسم المورد
                </label>
                <input
                  type="text"
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  placeholder="أدخل اسم المورد..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSupplierInputSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  إنشاء التقرير
                </button>
                <button
                  onClick={() => {
                    setShowSupplierInputPopup(false)
                    setSupplierInput('')
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
                  autoFocus
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
    </>
  )
}
