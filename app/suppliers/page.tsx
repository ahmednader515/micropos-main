'use client'

import MainLayout from '@/components/MainLayout'

const suppliersButtons = [
  { label: 'اضافة مورد جديد', icon: '➕', onClick: () => (window.location.href = '/suppliers/new') },
  { label: 'الأرصدة الافتتاحيه و المبالغ النقدية للموردين', icon: '💵', onClick: () => (window.location.href = '/suppliers/balances') },
  { label: 'المبالغ المتبقية للموردين من الفواتير', icon: '🧾', onClick: () => (window.location.href = '/suppliers/payables') },
  { label: 'المبالغ المتبقية للموردين - تقرير', icon: '📄', onClick: () => (window.location.href = '/suppliers/payables') },
  { label: 'الموردين المتبقي عندهم ارصدة - تقرير', icon: '📊', onClick: () => (window.location.href = '/suppliers/payables?summary=1') },
  { label: 'فحص ارصدة الموردين', icon: '🔍', onClick: () => (window.location.href = '/suppliers/audit') },
  { label: 'عرض الموردين', icon: '🏢', onClick: () => (window.location.href = '/suppliers/list') },
];

function SuppliersNavbar() {
  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-2 py-3 lg:hidden">
      {/* Back button on the left for LTR */}
      <button
        onClick={() => window.history.back()}
        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
        style={{ minWidth: 40 }}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-7 7 7 7" />
        </svg>
      </button>
      {/* Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-semibold text-gray-900 truncate">الموردين</h1>
      </div>
      {/* Suppliers icon on the right */}
      <span className="text-2xl px-2">🏢</span>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <MainLayout hideNavbar={true}>
      <SuppliersNavbar />
      <div className="flex flex-col gap-4 mt-6">
        {suppliersButtons.map((btn, idx) => (
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