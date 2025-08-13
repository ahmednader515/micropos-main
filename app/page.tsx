import MainLayout from '@/components/MainLayout'
import Link from 'next/link'

const homeButtons = [
  { label: 'المبيعات', icon: '💰', href: '/sales' },
  { label: 'المشتريات', icon: '🛒', href: '/purchases' },
  { label: 'العملاء', icon: '👥', href: '/customers' },
  { label: 'الموردين', icon: '🏢', href: '/suppliers' },
  { label: 'الصندوق', icon: '💵', href: '/cashbox' },
  { label: 'المصروفات', icon: '💸', href: '/expenses' },
  { label: 'المخزون', icon: '📦', href: '/inventory' },
  { label: 'الاستعلامات', icon: '🔍', href: '/inquiries' },
]

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-0 bg-gray-100" dir="rtl">
        <div className="w-full max-w-full mx-auto px-0 py-0" style={{ height: '80vh' }}>
          <div className="grid grid-cols-2 gap-2 h-full">
            {homeButtons.map((btn, idx) => (
              <Link
                key={btn.label}
                href={btn.href}
                className="flex flex-col items-center justify-center rounded-xl bg-white border border-gray-300 text-gray-800 text-base font-semibold shadow-sm active:bg-gray-200 transition-all select-none h-full"
              >
                <span className="text-xl mb-1">{btn.icon}</span>
                {btn.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 