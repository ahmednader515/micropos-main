'use client'

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

const systemSettings = [
  'الاعدادات',
  'الضرائب',
  'الطابعه',
]

const backup = [
  'النسخ الاحتياطي للبيانات',
]

export default function Sidebar({ onClose }: SidebarProps) {
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
              <li key={idx} className="rounded bg-gray-100 text-gray-800 px-3 py-2 text-sm border border-transparent hover:bg-gray-200 transition">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-gray-700 font-bold mb-2">اعدادات النظام</div>
          <ul className="space-y-1">
            {systemSettings.map((item, idx) => (
              <li key={idx} className="rounded bg-gray-100 text-gray-800 px-3 py-2 text-sm border border-transparent hover:bg-gray-200 transition">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-gray-700 font-bold mb-2">النسخ الاحتياطي</div>
          <ul className="space-y-1">
            {backup.map((item, idx) => (
              <li key={idx} className="rounded bg-gray-100 text-gray-800 px-3 py-2 text-sm border border-transparent hover:bg-gray-200 transition">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300"></div>
          <div className="mr-3">
            <p className="text-sm font-medium text-gray-900">مشرف النظام</p>
            <p className="text-xs text-gray-500">admin@micropos.com</p>
          </div>
        </div>
      </div>
    </div>
  )
} 