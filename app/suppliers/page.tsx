'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

export default function SuppliersPage() {
  const [loadingStates, setLoadingStates] = useState({
    payables: false,
    summary: false,
    audit: false
  })

  const handleGeneratePDF = async (type: 'payables' | 'summary' | 'audit') => {
    setLoadingStates(prev => ({ ...prev, [type]: true }))
    
    try {
      let endpoint = ''
      let filename = ''
      
      switch (type) {
        case 'payables':
          endpoint = '/api/reports/suppliers/payables'
          filename = 'supplier_payables.pdf'
          break
        case 'summary':
          endpoint = '/api/reports/suppliers/payables?summary=1'
          filename = 'supplier_payables_summary.pdf'
          break
        case 'audit':
          endpoint = '/api/reports/suppliers/audit'
          filename = 'supplier_audit.pdf'
          break
      }
      
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('حدث خطأ أثناء إنشاء ملف PDF')
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }))
    }
  }

  const suppliersButtons = [
    { label: 'اضافة مورد جديد', icon: '➕', onClick: () => (window.location.href = '/suppliers/new') },
    { label: 'الأرصدة الافتتاحيه و المبالغ النقدية للموردين', icon: '💵', onClick: () => (window.location.href = '/suppliers/balances') },
    { label: 'المبالغ المتبقية للموردين من الفواتير', icon: '🧾', onClick: () => (window.location.href = '/suppliers/payables') },
    { 
      label: 'المبالغ المتبقية للموردين - تقرير', 
      icon: '📄', 
      onClick: () => handleGeneratePDF('payables'),
      loading: loadingStates.payables
    },
    { 
      label: 'الموردين المتبقي عندهم ارصدة - تقرير', 
      icon: '📊', 
      onClick: () => handleGeneratePDF('summary'),
      loading: loadingStates.summary
    },
    { 
      label: 'فحص ارصدة الموردين - تقرير', 
      icon: '🔍', 
      onClick: () => handleGeneratePDF('audit'),
      loading: loadingStates.audit
    },
    { label: 'عرض الموردين', icon: '🏢', onClick: () => (window.location.href = '/suppliers/list') },
  ];

  function SuppliersNavbar() {
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
          <h1 className="text-lg font-semibold text-gray-900 truncate">الموردين</h1>
        </div>
        {/* Suppliers icon on the right */}
        <span className="text-2xl px-2">🏢</span>
      </div>
    );
  }

  useEffect(() => {
    try { window.history.pushState({ backToHome: true }, '') } catch {}
    const onPop = () => { window.location.assign('/') }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return (
    <MainLayout hideNavbar={true}>
      <SuppliersNavbar />
      <div className="flex flex-col gap-4 mt-6">
        {suppliersButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            disabled={btn.loading}
            className="w-full py-4 rounded-lg bg-white border border-gray-300 text-gray-800 text-sm font-semibold shadow flex flex-row-reverse items-center justify-between pr-4 pl-2 hover:bg-gray-50 transition text-right disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <span className="text-sm ml-3">
              {btn.loading ? (
                <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full"/>
              ) : (
                btn.icon
              )}
            </span>
            <span className="flex-1 text-right text-sm">
              {btn.loading ? 'جاري إنشاء PDF...' : btn.label}
            </span>
          </button>
        ))}
      </div>
    </MainLayout>
  );
} 