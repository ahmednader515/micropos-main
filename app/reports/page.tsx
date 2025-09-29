'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'

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
    phone?: string
  }
  saleItems: {
    id: string
    quantity: number
    price: string
    product: {
      name: string
    }
  }[]
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [invoicesPerPage] = useState(10)
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
  const [showInvoiceActionsModal, setShowInvoiceActionsModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (Array.isArray(invoices)) {
      const filtered = invoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredInvoices(filtered)
      setCurrentPage(1)
    } else {
      setFilteredInvoices([])
    }
  }, [searchTerm, invoices])

  const fetchInvoices = async () => {
    try {
      let url = '/api/sales'
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
        // The API returns { sales: [], pagination: {} }
        if (data && Array.isArray(data.sales)) {
          setInvoices(data.sales)
        } else if (Array.isArray(data)) {
          // Fallback if API returns direct array
          setInvoices(data)
        } else {
          console.error('API returned unexpected data format:', data)
          setInvoices([])
        }
      } else {
        console.error('Failed to fetch invoices:', response.status, response.statusText)
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([])
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


  const handlePrintReport = async () => {
    try {
      // Generate a comprehensive report
      const reportData = {
        title: 'تقرير الفواتير',
        dateRange: startDate && endDate ? `${startDate} - ${endDate}` : 'جميع الفترات',
        totalInvoices: filteredInvoices.length,
        totalAmount: filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
        invoices: filteredInvoices
      }
      
      // For now, we'll create a simple text report
      const reportText = `
تقرير الفواتير
================
الفترة الزمنية: ${reportData.dateRange}
عدد الفواتير: ${reportData.totalInvoices}
إجمالي المبلغ: ${formatCurrency(reportData.totalAmount)}

تفاصيل الفواتير:
${filteredInvoices.map(invoice => 
  `- ${invoice.invoiceNumber}: ${invoice.customer?.name || 'عميل نقدي'} - ${formatCurrency(Number(invoice.totalAmount))}`
).join('\n')}
      `
      
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/pdf/invoice?id=${invoice.id}`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error printing invoice:', error)
    }
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceActionsModal(true)
  }

  const handleViewInvoice = () => {
    if (selectedInvoice) {
      handlePrintInvoice(selectedInvoice)
    }
    setShowInvoiceActionsModal(false)
  }

  const handleEditInvoice = () => {
    if (selectedInvoice) {
      // Redirect to sales page with invoice loaded for editing
      window.location.href = `/sales?edit=${selectedInvoice.invoiceNumber}`
    }
    setShowInvoiceActionsModal(false)
  }

  const handleReturnInvoice = () => {
    if (selectedInvoice) {
      // Redirect to return invoice page
      window.location.href = `/return-invoice?invoice=${selectedInvoice.invoiceNumber}`
    }
    setShowInvoiceActionsModal(false)
  }

  const handleCancelInvoice = () => {
    if (selectedInvoice) {
      // Redirect to cancel invoice page
      window.location.href = `/cancel-invoice?invoice=${selectedInvoice.invoiceNumber}`
    }
    setShowInvoiceActionsModal(false)
  }

  // Pagination
  const indexOfLastInvoice = currentPage * invoicesPerPage
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage
  const currentInvoices = Array.isArray(filteredInvoices) ? filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice) : []
  const totalPages = Array.isArray(filteredInvoices) ? Math.ceil(filteredInvoices.length / invoicesPerPage) : 0

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <MainLayout
      navbarTitle="التقارير والفواتير"
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
                placeholder="رقم الفاتورة او اسم العميل"
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
                    fetchInvoices()
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
                    fetchInvoices()
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
                    fetchInvoices()
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
                    fetchInvoices()
                  }}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoices Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : currentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">لا توجد فواتير</div>
            </div>
          ) : (
            <>
              {currentInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleInvoiceClick(invoice)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* رقم الفاتورة */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">رقم الفاتورة</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">#{invoice.invoiceNumber}</div>
                      </div>
                    </div>

                    {/* اسم العميل */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">اسم العميل</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {invoice.customer ? invoice.customer.name : 'عميل نقدي'}
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
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatDate(invoice.createdAt)}</div>
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
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatTime(invoice.createdAt)}</div>
                      </div>
                    </div>

                    {/* اجمالي السعر للفاتورة */}
                    <div className="flex items-center gap-2 col-span-2 lg:col-span-1">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">اجمالي السعر للفاتورة</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{formatCurrency(Number(invoice.totalAmount))}</div>
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
                        عرض <span className="font-medium">{indexOfFirstInvoice + 1}</span> إلى{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastInvoice, filteredInvoices.length)}
                        </span>{' '}
                        من <span className="font-medium">{filteredInvoices.length}</span> فاتورة
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

      {/* Invoice Actions Modal */}
      {showInvoiceActionsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white w-full max-w-md mx-4 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">إجراءات الفاتورة #{selectedInvoice.invoiceNumber}</h3>
            </div>
            
            <div className="p-4 space-y-3">
              <button
                onClick={handleViewInvoice}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                عرض الفاتورة
              </button>
              
              <button
                onClick={handleEditInvoice}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                تعديل الفاتورة
              </button>
              
              <button
                onClick={handleReturnInvoice}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                ارجاع الفاتورة
              </button>
              
              <button
                onClick={handleCancelInvoice}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                الغاء الفاتورة
              </button>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowInvoiceActionsModal(false)}
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