'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'

interface Purchase {
  id: string
  invoiceNumber: string
  totalAmount: string
  paidAmount: string
  paymentMethod: string
  status: string
  createdAt: string
  supplier?: {
    id: string
    name: string
    phone?: string
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

export default function PurchasesInvoicesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [purchasesPerPage] = useState(10)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [showPurchaseActionsModal, setShowPurchaseActionsModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    if (Array.isArray(purchases)) {
      const filtered = purchases.filter(purchase =>
        purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredPurchases(filtered)
      setCurrentPage(1)
    } else {
      setFilteredPurchases([])
    }
  }, [searchTerm, purchases])

  const fetchPurchases = async () => {
    try {
      let url = '/api/purchases'
      const params = new URLSearchParams()
      
      if (startDate) {
        const startDateTime = `${startDate}T${startTime}:00.000Z`
        params.append('startDate', startDateTime)
      }
      if (endDate) {
        const endDateTime = `${endDate}T${endTime}:59.999Z`
        params.append('endDate', endDateTime)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // The API returns an array of purchases
        if (Array.isArray(data)) {
          setPurchases(data)
        } else if (data && Array.isArray(data.purchases)) {
          setPurchases(data.purchases)
        } else {
          console.error('API returned unexpected data format:', data)
          setPurchases([])
        }
      } else {
        console.error('Failed to fetch purchases:', response.status, response.statusText)
        setPurchases([])
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const englishNumerals = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${englishNumerals} ج.م`
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'مكتملة'
      case 'PENDING':
        return 'معلقة'
      case 'CANCELLED':
        return 'ملغاة'
      default:
        return status
    }
  }

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'CASH':
        return 'نقد'
      case 'CARD':
        return 'بطاقة'
      case 'CHECK':
        return 'شيك'
      case 'BANK_TRANSFER':
        return 'تحويل بنكي'
      case 'MOBILE_PAYMENT':
        return 'دفع محمول'
      case 'CASHBOX':
        return 'صندوق'
      default:
        return paymentMethod
    }
  }

  const handlePrintReport = async () => {
    try {
      // Generate a comprehensive report
      const reportData = {
        title: 'تقرير فواتير المشتريات',
        dateRange: startDate && endDate ? `${startDate} - ${endDate}` : 'جميع الفترات',
        totalPurchases: filteredPurchases.length,
        totalAmount: filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0),
        purchases: filteredPurchases
      }
      
      // For now, we'll create a simple text report
      const reportText = `
تقرير فواتير المشتريات
====================
الفترة الزمنية: ${reportData.dateRange}
عدد الفواتير: ${reportData.totalPurchases}
إجمالي المبلغ: ${formatCurrency(reportData.totalAmount)}

تفاصيل الفواتير:
${filteredPurchases.map(purchase => 
  `- ${purchase.invoiceNumber}: ${purchase.supplier?.name || 'مورد نقدي'} - ${formatCurrency(Number(purchase.totalAmount))}`
).join('\n')}
      `
      
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchases-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const handlePrintPurchase = async (purchase: Purchase) => {
    try {
      const response = await fetch(`/api/pdf/purchase?id=${purchase.id}`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-${purchase.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error printing purchase:', error)
    }
  }

  const handlePurchaseClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowPurchaseActionsModal(true)
  }

  const handleViewPurchase = () => {
    if (selectedPurchase) {
      handlePrintPurchase(selectedPurchase)
    }
    setShowPurchaseActionsModal(false)
  }

  const handleEditPurchase = () => {
    if (selectedPurchase) {
      // Redirect to purchases page with purchase loaded for editing
      window.location.href = `/purchases?edit=${selectedPurchase.invoiceNumber}`
    }
    setShowPurchaseActionsModal(false)
  }

  const handleReturnPurchase = () => {
    if (selectedPurchase) {
      // Redirect to return purchase page
      window.location.href = `/return-purchase?purchase=${selectedPurchase.invoiceNumber}`
    }
    setShowPurchaseActionsModal(false)
  }

  const handleCancelPurchase = () => {
    if (selectedPurchase) {
      // Redirect to cancel purchase page
      window.location.href = `/cancel-purchase?purchase=${selectedPurchase.invoiceNumber}`
    }
    setShowPurchaseActionsModal(false)
  }

  // Pagination
  const indexOfLastPurchase = currentPage * purchasesPerPage
  const indexOfFirstPurchase = indexOfLastPurchase - purchasesPerPage
  const currentPurchases = Array.isArray(filteredPurchases) ? filteredPurchases.slice(indexOfFirstPurchase, indexOfLastPurchase) : []
  const totalPages = Array.isArray(filteredPurchases) ? Math.ceil(filteredPurchases.length / purchasesPerPage) : 0

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <MainLayout
      navbarTitle="فواتير المشتريات"
      onBack={() => window.history.back()}
    >
      <div className="space-y-6" dir="rtl">
        {/* Search Bar with Print Report Button */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="رقم الفاتورة او اسم المورد"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تقرير
            </button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">اختيار الفترة الزمنية</h3>
          
          <div className="space-y-3">
            {/* Date Selection */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setLoading(true)
                    fetchPurchases()
                  }}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setLoading(true)
                    fetchPurchases()
                  }}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Time Selection */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">من وقت</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    setLoading(true)
                    fetchPurchases()
                  }}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">إلى وقت</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    setLoading(true)
                    fetchPurchases()
                  }}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Purchases Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : currentPurchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">لا توجد فواتير مشتريات</div>
            </div>
          ) : (
            <>
              {currentPurchases.map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handlePurchaseClick(purchase)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* رقم الفاتورة */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">رقم الفاتورة</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">#{purchase.invoiceNumber}</div>
                      </div>
                    </div>

                    {/* اسم المورد */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">اسم المورد</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {purchase.supplier ? purchase.supplier.name : 'مورد نقدي'}
                        </div>
                      </div>
                    </div>

                    {/* تاريخ الفاتورة */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">تاريخ الفاتورة</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatDate(purchase.createdAt)}</div>
                      </div>
                    </div>

                    {/* وقت الفاتورة */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">وقت الفاتورة</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatTime(purchase.createdAt)}</div>
                      </div>
                    </div>

                    {/* اجمالي السعر للفاتورة */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">اجمالي السعر</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatCurrency(Number(purchase.totalAmount))}</div>
                      </div>
                    </div>

                    {/* الحالة وطريقة الدفع */}
                    <div className="flex items-center gap-2 col-span-2 lg:col-span-1">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">الحالة / طريقة الدفع</div>
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                            {getStatusText(purchase.status)}
                          </span>
                          <span className="text-xs text-gray-600">{getPaymentMethodText(purchase.paymentMethod)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 rounded-lg shadow-sm">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      التالي
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        عرض <span className="font-medium">{indexOfFirstPurchase + 1}</span> إلى{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastPurchase, filteredPurchases.length)}
                        </span>{' '}
                        من <span className="font-medium">{filteredPurchases.length}</span> فاتورة
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          السابق
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === number
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          التالي
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Purchase Actions Modal */}
      {showPurchaseActionsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white w-full max-w-md mx-4 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">إجراءات الفاتورة #{selectedPurchase.invoiceNumber}</h3>
            </div>
            
            <div className="p-4 space-y-3">
              <button
                onClick={handleViewPurchase}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                عرض الفاتورة
              </button>
              
              <button
                onClick={handleEditPurchase}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                تعديل الفاتورة
              </button>
              
              <button
                onClick={handleReturnPurchase}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                ارجاع الفاتورة
              </button>
              
              <button
                onClick={handleCancelPurchase}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                الغاء الفاتورة
              </button>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowPurchaseActionsModal(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
