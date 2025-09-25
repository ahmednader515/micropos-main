'use client'

import { useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import Link from 'next/link'

type InventoryButton = { label: string; icon: string } & ({ href: string } | { onClick: () => void })

const inventoryButtons: InventoryButton[] = [
  { label: 'اضافة منتج جديد', icon: '➕', href: '/inventory/new-product' },
  { label: 'عرض المنتجات', icon: '📦', href: '/inventory/products' },
  { label: 'اضافة تصنيف جديد', icon: '🏷️', href: '/inventory/categories/new' },
  { label: 'تعديل اسعار المنتجات', icon: '💲', href: '/inventory/price-adjust' },
  { label: 'استيراد بيانات المنتجات من ملف اكسل/CSV', icon: '📥', href: '/inventory/import' },
];

function InventoryNavbar() {
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
        <h1 className="text-lg font-semibold text-gray-900 truncate">المخزون</h1>
      </div>
      {/* Box icon on the right */}
      <span className="text-2xl px-2">📦</span>
    </div>
  );
}

export default function InventoryPage() {
  useEffect(() => {
    try { window.history.pushState({ backToHome: true }, '') } catch {}
    const onPop = () => { window.location.assign('/') }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return (
    <MainLayout hideNavbar={true}>
      <InventoryNavbar />
      <div className="flex flex-col gap-4 mt-6">
        {inventoryButtons.map((btn, idx) => {
          if ('href' in btn) {
            return (
              <Link
                key={idx}
                href={btn.href}
                className="w-full py-4 rounded-lg bg-white border border-gray-300 text-gray-800 text-base font-semibold shadow flex flex-row-reverse items-center justify-between pr-4 pl-2 hover:bg-gray-50 transition text-right"
              >
                <span className="text-lg ml-3">{btn.icon}</span>
                <span className="flex-1 text-right text-base">{btn.label}</span>
              </Link>
            )
          } else {
            return (
              <button
                key={idx}
                onClick={btn.onClick}
                className="w-full py-4 rounded-lg bg-white border border-gray-300 text-gray-800 text-base font-semibold shadow flex flex-row-reverse items-center justify-between pr-4 pl-2 hover:bg-gray-50 transition text-right"
              >
                <span className="text-lg ml-3">{btn.icon}</span>
                <span className="flex-1 text-right text-base">{btn.label}</span>
              </button>
            )
          }
        })}
      </div>
    </MainLayout>
  );
} 