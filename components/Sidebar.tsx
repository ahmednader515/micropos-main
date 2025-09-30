'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import InvoiceNumberInputPopup from './InvoiceNumberInputPopup'

interface SidebarProps {
  onClose?: () => void
}

const advancedProcessing = [
  'تعديل فاتورة مبيعات',
  'تعديل فاتورة مشتريات',
  'الغاء فاتورة مبيعات/مشتريات',
  'الغاء مبلغ - صندوق/مصروفات',
  'الغاء سند - قبض/صرف',
  'ارجاع فاتورة مبيعات',
  'ارجاع فاتورة مشتريات',
  'الغاء فاتورة مرتجع مبيعات',
  'التحويل بين العملاء و الموردين',
  'معالجة المنتجات التالفة',
  'شاشة عرض الأسعار',
]


const backup = [
  'النسخ الاحتياطي للبيانات',
]

export default function Sidebar({ onClose }: SidebarProps) {
  const [showEditSalesInvoicePopup, setShowEditSalesInvoicePopup] = useState(false)
  const [showEditPurchaseInvoicePopup, setShowEditPurchaseInvoicePopup] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const { data: session } = useSession()

  const handleAdvancedItemClick = (item: string) => {
    if (item === 'تعديل فاتورة مبيعات') {
      // Close the sidebar before showing popup
      onClose?.()
      setShowEditSalesInvoicePopup(true)
    } else if (item === 'تعديل فاتورة مشتريات') {
      onClose?.()
      setShowEditPurchaseInvoicePopup(true)
    } else if (item === 'الغاء فاتورة مبيعات/مشتريات') {
      // Navigate to cancel invoice page
      onClose?.()
      window.location.href = '/cancel-invoice'
    } else if (item === 'الغاء مبلغ - صندوق/مصروفات') {
      // Navigate to cashbox page for amount cancellation
      onClose?.()
      window.location.href = '/cashbox'
    } else if (item === 'الغاء سند - قبض/صرف') {
      // Navigate to customers page for receipt cancellation
      onClose?.()
      window.location.href = '/customers'
    } else if (item === 'ارجاع فاتورة مبيعات') {
      // Navigate to return invoice page for sales
      onClose?.()
      window.location.href = '/return-invoice?type=sales'
    } else if (item === 'ارجاع فاتورة مشتريات') {
      // Navigate to return invoice page for purchases
      onClose?.()
      window.location.href = '/return-invoice?type=purchases'
    } else if (item === 'الغاء فاتورة مرتجع مبيعات') {
      // Navigate to return invoice page for canceling returns
      onClose?.()
      window.location.href = '/return-invoice?action=cancel'
    } else if (item === 'التحويل بين العملاء و الموردين') {
      // Navigate to customers page for transfer functionality
      onClose?.()
      window.location.href = '/customers?action=transfer'
    } else if (item === 'معالجة المنتجات التالفة') {
      // Navigate to inventory page for damaged products
      onClose?.()
      window.location.href = '/inventory?action=damaged'
    } else if (item === 'شاشة عرض الأسعار') {
      // Navigate to price display page
      onClose?.()
      window.location.href = '/price-display'
    }
  }

  const handleBackupItemClick = async (item: string) => {
    if (item === 'النسخ الاحتياطي للبيانات') {
      setIsBackingUp(true)
      try {
        const response = await fetch('/api/backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()
        
        if (result.success) {
          alert(result.message || 'تم إنشاء النسخة الاحتياطية بنجاح')
        } else {
          alert(`فشل في إنشاء النسخة الاحتياطية: ${result.error}`)
        }
      } catch (error) {
        console.error('Backup error:', error)
        alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية')
      } finally {
        setIsBackingUp(false)
        onClose?.()
      }
    }
  }

  const handleSubmitEditSalesInvoice = (invoiceNumber: string) => {
    // Navigate to sales page with invoice loaded for editing
    window.location.href = `/sales?edit=${encodeURIComponent(invoiceNumber)}`
    setShowEditSalesInvoicePopup(false)
    onClose?.()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200" dir="rtl">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">مايكرو POS</h1>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="text-gray-700 font-bold mb-2">معالجات متقدمة</div>
          <ul className="space-y-1">
            {advancedProcessing.map((item, idx) => (
              <li
                key={idx}
                onClick={() => handleAdvancedItemClick(item)}
                className="cursor-pointer rounded bg-gray-100 text-gray-800 px-3 py-2 text-sm border border-transparent hover:bg-gray-200 transition"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-gray-700 font-bold mb-2">النسخ الاحتياطي</div>
          <ul className="space-y-1">
            {backup.map((item, idx) => (
              <li 
                key={idx} 
                onClick={() => handleBackupItemClick(item)}
                className={`cursor-pointer rounded bg-gray-100 text-gray-800 px-3 py-2 text-sm border border-transparent hover:bg-gray-200 transition ${
                  isBackingUp ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isBackingUp ? 'جاري إنشاء النسخة الاحتياطية...' : item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {session?.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="mr-3">
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || 'المستخدم'}
            </p>
            <p className="text-xs text-gray-500">{session?.user?.phone}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full text-left text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          تسجيل الخروج
        </button>
    </div>
      {showEditSalesInvoicePopup && (
        <InvoiceNumberInputPopup
          isVisible={showEditSalesInvoicePopup}
          onClose={() => setShowEditSalesInvoicePopup(false)}
          title="إدخال رقم فاتورة المبيعات للتعديل"
          onSubmit={handleSubmitEditSalesInvoice}
        />
      )}
      {showEditPurchaseInvoicePopup && (
        <InvoiceNumberInputPopup
          isVisible={showEditPurchaseInvoicePopup}
          onClose={() => setShowEditPurchaseInvoicePopup(false)}
          title="إدخال رقم فاتورة المشتريات للتعديل"
          onSubmit={(invoiceNumber) => {
            window.location.href = `/purchases?edit=${encodeURIComponent(invoiceNumber)}`
            setShowEditPurchaseInvoicePopup(false)
            onClose?.()
          }}
        />
      )}
    </div>
  )
} 