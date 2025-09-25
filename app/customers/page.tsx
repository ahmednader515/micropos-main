'use client'

import { useEffect } from 'react'
import MainLayout from '@/components/MainLayout'

const customersButtons = [
  { label: 'اضافة عميل جديد', icon: '➕', onClick: () => (window.location.href = '/customers/new') },
  { label: 'الارصدة الافتتاحية و المبالغ النقدية للعملاء', icon: '💵', onClick: () => (window.location.href = '/customers/balances') },
  {
    label: 'ذمم العملاء - المبالغ المتبقية عند العملاء من الفواتير',
    icon: '🧾',
    onClick: () => (window.location.href = '/customers/receivables')
  },
  {
    label: 'ذمم العملاء - تقرير',
    icon: '📄',
    onClick: async () => {
      const res = await fetch('/api/reports/customers/receivables?summary=1', { method: 'GET' })
      if (!res.ok) return alert('تعذّر إنشاء التقرير')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'customer_receivables_summary.pdf'
      a.click()
      URL.revokeObjectURL(url)
    }
  },
  {
    label: 'العملاء المتبقي لهم ارصدة - تقرير',
    icon: '📊',
    onClick: async () => {
      const res = await fetch('/api/reports/customers/remaining-balances', { method: 'GET' })
      if (!res.ok) return alert('تعذّر إنشاء التقرير')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'customers_remaining_balances.pdf'
      a.click()
      URL.revokeObjectURL(url)
    }
  },
  {
    label: 'فحص ارصدة العملاء - تقرير',
    icon: '🔍',
    onClick: async () => {
      const res = await fetch('/api/reports/customers/audit', { method: 'GET' })
      if (!res.ok) return alert('تعذّر إنشاء التقرير')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'customer_audit.pdf'
      a.click()
      URL.revokeObjectURL(url)
    }
  },
  { label: 'عرض  العملاء', icon: '👥', onClick: () => (window.location.href = '/customers/list') },
];

function CustomersNavbar() {
  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-2 py-3 lg:hidden">
      {/* Back button on the left for LTR */}
      <button
        onClick={() => (window.location.href = '/')}
        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
        style={{ minWidth: 40 }}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-7 7 7 7" />
        </svg>
      </button>
      {/* Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-semibold text-gray-900 truncate">العملاء</h1>
      </div>
      {/* People icon on the right */}
      <span className="text-2xl px-2">👥</span>
    </div>
  );
}

export default function CustomersPage() {
  useEffect(() => {
    try { window.history.pushState({ backToHome: true }, '') } catch {}
    const onPop = () => { window.location.assign('/') }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return (
    <MainLayout hideNavbar={true}>
      <CustomersNavbar />
      <div className="flex flex-col gap-4 mt-6">
        {customersButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            className="w-full py-4 rounded-lg bg-white border border-gray-300 text-gray-800 text-sm font-semibold shadow flex flex-row-reverse items-center justify-between pr-4 pl-2 hover:bg-gray-50 transition text-right"
          >
            <span className="text-sm ml-3">{btn.icon}</span>
            <span className="flex-1 text-right text-sm">{btn.label}</span>
          </button>
        ))}
      </div>
    </MainLayout>
  );
} 