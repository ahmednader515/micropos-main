'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface ReportItem {
  id: string
  title: string
  value: string
}

interface ReportSection {
  id: string
  title: string
  items: ReportItem[]
}

interface ReportData {
  cashbox: {
    currentBalance: number
    periodBalance: number
  }
  sales: {
    totalSales: number
    cashSales: number
    creditSales: number
    cardSales: number
    checkSales: number
    totalReturns: number
    totalDiscounts: number
    totalTaxes: number
    customerInvoiceBalance: number
    customerOpeningBalance: number
    customerPaymentsTotal: number
    totalProfits: number
    netProfits: number
  }
  purchases: {
    totalPurchases: number
    cashPurchases: number
    creditPurchases: number
    cardPurchases: number
    checkPurchases: number
    purchaseReturns: number
    supplierInvoiceBalance: number
    supplierOpeningBalance: number
    supplierPaymentsTotal: number
  }
  expenses: {
    totalExpenses: number
  }
}

export default function StoreMovementPage() {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: number) => {
    const englishNumerals = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${englishNumerals} ج.م`
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching report data...')
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)
      
      const response = await fetch(`/api/reports/store-movement?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Received report data:', data)
        setReportData(data)
        showNotification('success', 'تم تحديث البيانات للفترة المحددة')
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText)
        showNotification('error', 'فشل في جلب البيانات')
      }
    } catch (error) {
      console.error('❌ Error fetching report data:', error)
      showNotification('error', 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate])

  const getReportSections = (): ReportSection[] => {
    console.log('🔍 getReportSections called, reportData:', reportData)
    if (!reportData) {
      console.log('⚠️ No report data, returning placeholder data')
      return [
        {
          id: 'cashbox',
          title: 'الرصيد في الصندوق',
          items: [
            { id: 'cashbox-balance', title: 'الرصيد في الصندوق', value: '0.00' },
            { id: 'cashbox-balance-period', title: 'الرصيد في الصندوق خلال الفترة', value: '0.00' }
          ]
        },
        {
          id: 'sales',
          title: 'المبيعات',
          items: [
            { id: 'total-sales', title: 'اجمالي المبيعات', value: '0.00' },
            { id: 'cash-sales', title: 'اجمالي المبيعات نقدا', value: '0.00' },
            { id: 'credit-sales', title: 'اجمالي المبيعات اجل', value: '0.00' },
            { id: 'card-sales', title: 'اجمالي المبيعات (بطاقة)', value: '0.00' },
            { id: 'check-sales', title: 'اجمالي المبيعات (شيك)', value: '0.00' },
            { id: 'total-returns', title: 'اجمالي المرتجع', value: '0.00' },
            { id: 'total-discounts', title: 'اجمالي الخصومات', value: '0.00' },
            { id: 'total-taxes', title: 'اجمالي الضرائب', value: '0.00' },
            { id: 'customer-invoice-balance', title: 'اجمالي المتبقي عند العملاء من الفواتير', value: '0.00' },
            { id: 'customer-opening-balance', title: 'اجمالي المتبقي عند العملاء من الارصدة الافتتاحية و النقد', value: '0.00' },
            { id: 'customer-payments', title: 'اجمالي السداد من العملاء', value: '0.00' },
            { id: 'total-profits', title: 'اجمالي الارباح', value: '0.00' },
            { id: 'net-profits', title: 'اجمالي الارباح بعد خصم المصروفات', value: '0.00' }
          ]
        },
        {
          id: 'purchases',
          title: 'المشتريات',
          items: [
            { id: 'total-purchases', title: 'اجمالي المشتريات', value: '0.00' },
            { id: 'cash-purchases', title: 'اجمالي المشتريات نقدا', value: '0.00' },
            { id: 'credit-purchases', title: 'اجمالي المشتريات اجل', value: '0.00' },
            { id: 'card-purchases', title: 'اجمالي المشتريات (بطاقة)', value: '0.00' },
            { id: 'check-purchases', title: 'اجمالي المشتريات (شيك)', value: '0.00' },
            { id: 'purchase-returns', title: 'اجمالي المرتجع', value: '0.00' },
            { id: 'supplier-invoice-balance', title: 'اجمالي المتبقي للموردين من الفواتير', value: '0.00' },
            { id: 'supplier-opening-balance', title: 'اجمالي المتبقي للموردين من الارصدة الافتتاحية و النقد', value: '0.00' },
            { id: 'supplier-payments', title: 'اجمالي السداد للموردين', value: '0.00' }
          ]
        },
        {
          id: 'expenses',
          title: 'المصروفات',
          items: [
            { id: 'total-expenses', title: 'اجمالي المصروفات', value: '0.00' }
          ]
        }
      ]
    }

    console.log('✅ Using real report data')
    return [
      {
        id: 'cashbox',
        title: 'الرصيد في الصندوق',
        items: [
          { id: 'cashbox-balance', title: 'الرصيد في الصندوق', value: formatCurrency(reportData.cashbox.currentBalance) },
          { id: 'cashbox-balance-period', title: 'الرصيد في الصندوق خلال الفترة', value: formatCurrency(reportData.cashbox.periodBalance) }
        ]
      },
      {
        id: 'sales',
        title: 'المبيعات',
        items: [
          { id: 'total-sales', title: 'اجمالي المبيعات', value: formatCurrency(reportData.sales.totalSales) },
          { id: 'cash-sales', title: 'اجمالي المبيعات نقدا', value: formatCurrency(reportData.sales.cashSales) },
          { id: 'credit-sales', title: 'اجمالي المبيعات اجل', value: formatCurrency(reportData.sales.creditSales) },
          { id: 'card-sales', title: 'اجمالي المبيعات (بطاقة)', value: formatCurrency(reportData.sales.cardSales) },
          { id: 'check-sales', title: 'اجمالي المبيعات (شيك)', value: formatCurrency(reportData.sales.checkSales) },
          { id: 'total-returns', title: 'اجمالي المرتجع', value: formatCurrency(reportData.sales.totalReturns) },
          { id: 'total-discounts', title: 'اجمالي الخصومات', value: formatCurrency(reportData.sales.totalDiscounts) },
          { id: 'total-taxes', title: 'اجمالي الضرائب', value: formatCurrency(reportData.sales.totalTaxes) },
          { id: 'customer-invoice-balance', title: 'اجمالي المتبقي عند العملاء من الفواتير', value: formatCurrency(reportData.sales.customerInvoiceBalance) },
          { id: 'customer-opening-balance', title: 'اجمالي المتبقي عند العملاء من الارصدة الافتتاحية و النقد', value: formatCurrency(reportData.sales.customerOpeningBalance) },
          { id: 'customer-payments', title: 'اجمالي السداد من العملاء', value: formatCurrency(reportData.sales.customerPaymentsTotal) },
          { id: 'total-profits', title: 'اجمالي الارباح', value: formatCurrency(reportData.sales.totalProfits) },
          { id: 'net-profits', title: 'اجمالي الارباح بعد خصم المصروفات', value: formatCurrency(reportData.sales.netProfits) }
        ]
      },
      {
        id: 'purchases',
        title: 'المشتريات',
        items: [
          { id: 'total-purchases', title: 'اجمالي المشتريات', value: formatCurrency(reportData.purchases.totalPurchases) },
          { id: 'cash-purchases', title: 'اجمالي المشتريات نقدا', value: formatCurrency(reportData.purchases.cashPurchases) },
          { id: 'credit-purchases', title: 'اجمالي المشتريات اجل', value: formatCurrency(reportData.purchases.creditPurchases) },
          { id: 'card-purchases', title: 'اجمالي المشتريات (بطاقة)', value: formatCurrency(reportData.purchases.cardPurchases) },
          { id: 'check-purchases', title: 'اجمالي المشتريات (شيك)', value: formatCurrency(reportData.purchases.checkPurchases) },
          { id: 'purchase-returns', title: 'اجمالي المرتجع', value: formatCurrency(reportData.purchases.purchaseReturns) },
          { id: 'supplier-invoice-balance', title: 'اجمالي المتبقي للموردين من الفواتير', value: formatCurrency(reportData.purchases.supplierInvoiceBalance) },
          { id: 'supplier-opening-balance', title: 'اجمالي المتبقي للموردين من الارصدة الافتتاحية و النقد', value: formatCurrency(reportData.purchases.supplierOpeningBalance) },
          { id: 'supplier-payments', title: 'اجمالي السداد للموردين', value: formatCurrency(reportData.purchases.supplierPaymentsTotal) }
        ]
      },
      {
        id: 'expenses',
        title: 'المصروفات',
        items: [
          { id: 'total-expenses', title: 'اجمالي المصروفات', value: formatCurrency(reportData.expenses.totalExpenses) }
        ]
      }
    ]
  }

  return (
    <MainLayout navbarTitle="عرض حركة المتجر" onBack={() => window.history.back()} menuOptions={[]} removeTopPadding={true}>
      <div className="-mx-4">
        {/* Date Selector */}
        <div className="sticky top-0 z-10 bg-white p-3 shadow-sm border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">فترة التقرير</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">من</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:hidden"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs font-medium text-gray-700">إلى</span>
            </div>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:hidden"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              />
            </div>
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-0">
          {loading && (
            <div className="bg-white p-8 text-center">
              <div className="text-gray-500">جاري تحميل البيانات...</div>
            </div>
          )}
              {!loading && (
                <div>
                  {!reportData && (
                    <div className="bg-yellow-50 p-2 mb-2 text-center text-sm text-yellow-700">
                      ⚠️ عرض البيانات الافتراضية - تحقق من الاتصال
                    </div>
                  )}
                  {getReportSections().map((section) => (
                <div key={section.id} className="bg-white shadow-sm border-b border-gray-200">
                  <div className="px-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {section.items.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-gray-900 text-sm">{item.title}</span>
                        </div>
                        <div className="flex-shrink-0">
                          <input
                            type="text"
                            value={item.value}
                            readOnly
                            className="w-24 text-left px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {notification && (
        <FlashNotification
          type={notification.type}
          message={notification.message}
          isVisible={!!notification}
          onClose={() => setNotification(null)}
        />
      )}
    </MainLayout>
  )
}
