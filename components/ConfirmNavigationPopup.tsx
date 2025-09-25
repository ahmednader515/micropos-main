'use client'

interface ConfirmNavigationPopupProps {
  isVisible: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmNavigationPopup({ isVisible, title = 'تأكيد الخروج', message = 'هل تريد حقاً العودة؟ قد تفقد التغييرات غير المحفوظة.', confirmLabel = 'نعم، متابعة', cancelLabel = 'لا، البقاء', onConfirm, onCancel }: ConfirmNavigationPopupProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
          <p className="text-sm text-gray-700 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


