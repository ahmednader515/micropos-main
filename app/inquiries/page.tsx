'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface InquiryItem {
  id: string
  title: string
  onClick: () => void
}

interface InquirySection {
  id: string
  title: string
  items: InquiryItem[]
}

export default function InquiriesPage() {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleInquiryClick = (title: string, id: string) => {
    if (id === 'store-movement') {
      window.location.href = '/inquiries/store-movement'
    } else {
      showNotification('success', `تم فتح: ${title}`)
      // TODO: Implement actual inquiry functionality for other items
    }
  }

  const inquirySections: InquirySection[] = [
    {
      id: 'store',
      title: 'المتجر',
      items: [
        { id: 'store-movement', title: 'عرض حركة المتجر', onClick: () => handleInquiryClick('عرض حركة المتجر', 'store-movement') }
      ]
    },
    {
      id: 'sales',
      title: 'المبيعات',
      items: [
        { id: 'sales-report', title: 'تقرير بالمبيعات', onClick: () => handleInquiryClick('تقرير بالمبيعات', 'sales-report') },
        { id: 'profits-report', title: 'تقرير بالأرباح', onClick: () => handleInquiryClick('تقرير بالأرباح', 'profits-report') },
        { id: 'sales-invoices', title: 'عرض فواتير المبيعات', onClick: () => handleInquiryClick('عرض فواتير المبيعات', 'sales-invoices') },
        { id: 'discounts-report', title: 'تقرير بالخصومات', onClick: () => handleInquiryClick('تقرير بالخصومات', 'discounts-report') },
        { id: 'credit-invoices-report', title: 'تقرير بالفواتير الاجل', onClick: () => handleInquiryClick('تقرير بالفواتير الاجل', 'credit-invoices-report') },
        { id: 'returned-sales-report', title: 'تقرير بالفواتير المرتجع - مبيعات', onClick: () => handleInquiryClick('تقرير بالفواتير المرتجع - مبيعات', 'returned-sales-report') },
        { id: 'cancelled-sales-report', title: 'تقرير بفواتير المبيعات التي تم الغائها', onClick: () => handleInquiryClick('تقرير بفواتير المبيعات التي تم الغائها', 'cancelled-sales-report') },
        { id: 'quotes-report', title: 'تقرير بعروض الأسعار', onClick: () => handleInquiryClick('تقرير بعروض الأسعار', 'quotes-report') },
        { id: 'tax-by-category', title: 'اجمالي الضرائب حسب الصنف', onClick: () => handleInquiryClick('اجمالي الضرائب حسب الصنف', 'tax-by-category') },
        { id: 'tax-by-customer', title: 'اجمالي الضرائب حسب العميل', onClick: () => handleInquiryClick('اجمالي الضرائب حسب العميل', 'tax-by-customer') }
      ]
    },
    {
      id: 'customers',
      title: 'العملاء',
      items: [
        { id: 'customer-balances', title: 'ذمم العملاء', onClick: () => handleInquiryClick('ذمم العملاء', 'customer-balances') },
        { id: 'customer-account', title: 'كشف حساب عميل', onClick: () => handleInquiryClick('كشف حساب عميل', 'customer-account') },
        { id: 'customer-verification', title: 'تقرير مصادقة حساب العميل', onClick: () => handleInquiryClick('تقرير مصادقة حساب العميل', 'customer-verification') },
        { id: 'customer-opening-balance', title: 'تقرير بحركة الرصيد الأفتتاحي و النقد للعميل', onClick: () => handleInquiryClick('تقرير بحركة الرصيد الأفتتاحي و النقد للعميل', 'customer-opening-balance') },
        { id: 'customer-invoices', title: 'تقرير بالفواتير لعميل', onClick: () => handleInquiryClick('تقرير بالفواتير لعميل', 'customer-invoices') },
        { id: 'customer-invoices-total', title: 'تقرير بالفواتير لعميل - اجمالي', onClick: () => handleInquiryClick('تقرير بالفواتير لعميل - اجمالي', 'customer-invoices-total') },
        { id: 'customer-returned-invoices', title: 'تقرير بالفواتير المرتجع لعميل', onClick: () => handleInquiryClick('تقرير بالفواتير المرتجع لعميل', 'customer-returned-invoices') },
        { id: 'customer-receipts', title: 'تقرير بسندات القبض لعميل', onClick: () => handleInquiryClick('تقرير بسندات القبض لعميل', 'customer-receipts') },
        { id: 'customer-payments', title: 'تقرير بسندات الصرف لعميل', onClick: () => handleInquiryClick('تقرير بسندات الصرف لعميل', 'customer-payments') },
        { id: 'customer-settlement', title: 'تقرير بحركة التسديد لعميل', onClick: () => handleInquiryClick('تقرير بحركة التسديد لعميل', 'customer-settlement') },
        { id: 'customer-category-total', title: 'تقرير اجمالي حسب الصنف لعميل', onClick: () => handleInquiryClick('تقرير اجمالي حسب الصنف لعميل', 'customer-category-total') },
        { id: 'customer-payment-movement', title: 'تقرير بحركة السداد للعملاء', onClick: () => handleInquiryClick('تقرير بحركة السداد للعملاء', 'customer-payment-movement') },
        { id: 'customer-payment-method', title: 'تقرير بحركة السداد للعملاء حسب طريقة الدفع', onClick: () => handleInquiryClick('تقرير بحركة السداد للعملاء حسب طريقة الدفع', 'customer-payment-method') }
      ]
    },
    {
      id: 'purchases',
      title: 'المشتريات',
      items: [
        { id: 'purchases-report', title: 'تقرير بالمشتريات', onClick: () => handleInquiryClick('تقرير بالمشتريات', 'purchases-report') },
        { id: 'purchase-invoices', title: 'عرض فواتير المشتريات', onClick: () => handleInquiryClick('عرض فواتير المشتريات', 'purchase-invoices') },
        { id: 'returned-purchases-report', title: 'تقرير بالفواتير المرتجع - مشتريات', onClick: () => handleInquiryClick('تقرير بالفواتير المرتجع - مشتريات', 'returned-purchases-report') },
        { id: 'cancelled-purchases-report', title: 'تقرير بفواتير المشتريات التي تم الغائها', onClick: () => handleInquiryClick('تقرير بفواتير المشتريات التي تم الغائها', 'cancelled-purchases-report') },
        { id: 'purchase-orders-report', title: 'تقرير بطلبات الشراء', onClick: () => handleInquiryClick('تقرير بطلبات الشراء', 'purchase-orders-report') }
      ]
    },
    {
      id: 'suppliers',
      title: 'الموردين',
      items: [
        { id: 'supplier-balances', title: 'تقرير بالمتبقي للموردين', onClick: () => handleInquiryClick('تقرير بالمتبقي للموردين', 'supplier-balances') },
        { id: 'supplier-account', title: 'كشف حساب مورد', onClick: () => handleInquiryClick('كشف حساب مورد', 'supplier-account') },
        { id: 'supplier-opening-balance', title: 'تقرير بحركه الرصيد الافتتاحي و النقد للمورد', onClick: () => handleInquiryClick('تقرير بحركه الرصيد الافتتاحي و النقد للمورد', 'supplier-opening-balance') },
        { id: 'supplier-invoices', title: 'تقرير بالفواتير لمورد', onClick: () => handleInquiryClick('تقرير بالفواتير لمورد', 'supplier-invoices') },
        { id: 'supplier-invoices-total', title: 'تقرير بالفواتير لمورد - اجمالي', onClick: () => handleInquiryClick('تقرير بالفواتير لمورد - اجمالي', 'supplier-invoices-total') },
        { id: 'supplier-payments', title: 'تقرير بسندات الصرف لمورد', onClick: () => handleInquiryClick('تقرير بسندات الصرف لمورد', 'supplier-payments') },
        { id: 'supplier-receipts', title: 'تقرير بسندات القبض لمورد', onClick: () => handleInquiryClick('تقرير بسندات القبض لمورد', 'supplier-receipts') },
        { id: 'supplier-settlement', title: 'تقرير بحركة التسديد لمورد', onClick: () => handleInquiryClick('تقرير بحركة التسديد لمورد', 'supplier-settlement') },
        { id: 'supplier-category-total', title: 'تقرير اجمالي حسب الصنف لمورد', onClick: () => handleInquiryClick('تقرير اجمالي حسب الصنف لمورد', 'supplier-category-total') },
        { id: 'supplier-payment-movement', title: 'تقرير بحركة السداد للموردين', onClick: () => handleInquiryClick('تقرير بحركة السداد للموردين', 'supplier-payment-movement') },
        { id: 'supplier-payment-method', title: 'تقرير بحركة السداد للموردين حسب طريقة الدفع', onClick: () => handleInquiryClick('تقرير بحركة السداد للموردين حسب طريقة الدفع', 'supplier-payment-method') }
      ]
    },
    {
      id: 'inventory',
      title: 'المخازن',
      items: [
        { id: 'inventory-count', title: 'جرد مخزني', onClick: () => handleInquiryClick('جرد مخزني', 'inventory-count') },
        { id: 'inventory-by-category', title: 'جرد مخزني حسب التصنيف', onClick: () => handleInquiryClick('جرد مخزني حسب التصنيف', 'inventory-by-category') },
        { id: 'inventory-by-category-specific', title: 'جرد مخزني لتصنيف', onClick: () => handleInquiryClick('جرد مخزني لتصنيف', 'inventory-by-category-specific') },
        { id: 'expiry-report', title: 'تقرير بالمنتجات حسب تاريخ الانتهاء', onClick: () => handleInquiryClick('تقرير بالمنتجات حسب تاريخ الانتهاء', 'expiry-report') },
        { id: 'product-movement', title: 'تقرير بحركة منتح', onClick: () => handleInquiryClick('تقرير بحركة منتح', 'product-movement') },
        { id: 'damaged-products', title: 'تقرير بالمنتجات التالفة', onClick: () => handleInquiryClick('تقرير بالمنتجات التالفة', 'damaged-products') }
      ]
    },
    {
      id: 'cashbox',
      title: 'الصندوق',
      items: [
        { id: 'cashbox-movement', title: 'تقرير بحركة الصندوق', onClick: () => handleInquiryClick('تقرير بحركة الصندوق', 'cashbox-movement') },
        { id: 'capital-report', title: 'تقرير رأس المال', onClick: () => handleInquiryClick('تقرير رأس المال', 'capital-report') },
        { id: 'zakat-calculation', title: 'حساب الزكاة', onClick: () => handleInquiryClick('حساب الزكاة', 'zakat-calculation') },
        { id: 'tax-declaration', title: 'تقرير بالاقرار الضريبي', onClick: () => handleInquiryClick('تقرير بالاقرار الضريبي', 'tax-declaration') },
        { id: 'tax-declaration-with-returns', title: 'تقرير بالاقرار الضريبي معا المرتجع', onClick: () => handleInquiryClick('تقرير بالاقرار الضريبي معا المرتجع', 'tax-declaration-with-returns') }
      ]
    },
    {
      id: 'expenses',
      title: 'المصروفات',
      items: [
        { id: 'expenses-report', title: 'تقرير بالمصروفات', onClick: () => handleInquiryClick('تقرير بالمصروفات', 'expenses-report') },
        { id: 'expenses-by-account', title: 'تقرير بالمصروفات حسب الحساب', onClick: () => handleInquiryClick('تقرير بالمصروفات حسب الحساب', 'expenses-by-account') },
        { id: 'expenses-by-specific-account', title: 'تقرير بالمصروفات لحساب', onClick: () => handleInquiryClick('تقرير بالمصروفات لحساب', 'expenses-by-specific-account') },
        { id: 'expenses-by-payment-method', title: 'تقرير بالمصروفات حسب طريقة الدفع', onClick: () => handleInquiryClick('تقرير بالمصروفات حسب طريقة الدفع', 'expenses-by-payment-method') }
      ]
    }
  ]

  return (
    <MainLayout navbarTitle="الاستعلامات" onBack={() => window.history.back()} menuOptions={[]} removeTopPadding={true}>
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

        {/* Inquiry Sections */}
        <div className="space-y-0">
          {inquirySections.map((section) => (
            <div key={section.id} className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
              <div className="divide-y divide-gray-200">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full px-4 py-4 text-right hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <svg 
                        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-gray-900 group-hover:text-gray-700">{item.title}</span>
                </div>
                  </button>
                ))}
                </div>
              </div>
          ))}
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
