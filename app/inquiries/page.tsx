'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'
import SalesReportsPopup from '@/components/SalesReportsPopup'
import ProfitsReportsPopup from '@/components/ProfitsReportsPopup'
import DiscountsReportsPopup from '@/components/DiscountsReportsPopup'
import CustomerAccountPopup from '@/components/CustomerAccountPopup'
import CustomerInputPopup from '@/components/CustomerInputPopup'
import PaymentMethodPopup from '@/components/PaymentMethodPopup'
import PurchasesReportsPopup from '@/components/PurchasesReportsPopup'
import SupplierAccountPopup from '@/components/SupplierAccountPopup'
import SupplierInputPopup from '@/components/SupplierInputPopup'
import SupplierPaymentMethodPopup from '@/components/SupplierPaymentMethodPopup'
import InventoryCategoryInputPopup from '@/components/InventoryCategoryInputPopup'
import ProductMovementInputPopup from '@/components/ProductMovementInputPopup'
import ExpensesAccountInputPopup from '@/components/ExpensesAccountInputPopup'
import ExpensesPaymentMethodPopup from '@/components/ExpensesPaymentMethodPopup'

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
  const [showSalesReportsPopup, setShowSalesReportsPopup] = useState(false)
  const [showProfitsReportsPopup, setShowProfitsReportsPopup] = useState(false)
  const [showDiscountsReportsPopup, setShowDiscountsReportsPopup] = useState(false)
  const [showCustomerAccountPopup, setShowCustomerAccountPopup] = useState(false)
  const [showCustomerInputPopup, setShowCustomerInputPopup] = useState(false)
  const [showPaymentMethodPopup, setShowPaymentMethodPopup] = useState(false)
  const [showPurchasesReportsPopup, setShowPurchasesReportsPopup] = useState(false)
  const [showSupplierAccountPopup, setShowSupplierAccountPopup] = useState(false)
  const [showSupplierInputPopup, setShowSupplierInputPopup] = useState(false)
  const [showSupplierPaymentMethodPopup, setShowSupplierPaymentMethodPopup] = useState(false)
  const [showInventoryCategoryInputPopup, setShowInventoryCategoryInputPopup] = useState(false)
  const [showProductMovementInputPopup, setShowProductMovementInputPopup] = useState(false)
  const [showExpensesAccountInputPopup, setShowExpensesAccountInputPopup] = useState(false)
  const [showExpensesPaymentMethodPopup, setShowExpensesPaymentMethodPopup] = useState(false)
  const [currentCustomerPopup, setCurrentCustomerPopup] = useState<{ title: string; apiEndpoint: string } | null>(null)
  const [currentSupplierPopup, setCurrentSupplierPopup] = useState<{ title: string; apiEndpoint: string } | null>(null)
  const [currentInventoryPopup, setCurrentInventoryPopup] = useState<{ title: string; apiEndpoint: string } | null>(null)
  const [currentExpensesPopup, setCurrentExpensesPopup] = useState<{ title: string; apiEndpoint: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const generateCreditInvoicesPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'credit',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credit_invoices_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateCancelledSalesPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'cancelled',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cancelled_sales_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateQuotesPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'quotes',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quotes_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateTaxByCategoryPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'tax-by-category',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_by_category_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateTaxByCustomerPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'tax-by-customer',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/sales?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_by_customer_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateCustomerBalancesPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/customers/balances?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customer_balances_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generatePaymentMovementPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/customers/payment-movement?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payment_movement_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateReturnedPurchasesPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'returned',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/purchases?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `returned_purchases_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateCancelledPurchasesPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'cancelled',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/purchases?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cancelled_purchases_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generatePurchaseOrdersPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'orders',
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/purchases?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase_orders_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateSupplierBalancesPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/suppliers/balances?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `supplier_balances_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateSupplierPaymentMovementPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/suppliers/payment-movement?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `supplier_payment_movement_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateInventoryCountPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/inventory/count?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_count_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateInventoryByCategoryPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/inventory/by-category?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_by_category_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateExpiryReportPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/inventory/expiry?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expiry_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateDamagedProductsPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/inventory/damaged?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `damaged_products_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  // Cashbox PDF generation functions
  const generateCashboxMovementPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/cashbox/movement?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cashbox_movement_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateCapitalReportPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/cashbox/capital?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `capital_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateZakatCalculationPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/cashbox/zakat?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zakat_calculation_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateTaxDeclarationPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/cashbox/tax-declaration?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_declaration_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateTaxDeclarationWithReturnsPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/cashbox/tax-declaration-with-returns?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_declaration_with_returns_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  // Expenses PDF generation functions
  const generateExpensesReportPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/expenses/report?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses_report_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const generateExpensesByAccountPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      })
      
      const res = await fetch(`/api/reports/expenses/by-account?${params.toString()}`, { method: 'GET' })
      if (!res.ok) {
        alert('تعذّر إنشاء التقرير')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses_by_account_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('حدث خطأ أثناء تحميل التقرير')
    }
  }

  const openCustomerInputPopup = (title: string, apiEndpoint: string) => {
    setCurrentCustomerPopup({ title, apiEndpoint })
    setShowCustomerInputPopup(true)
  }

  const openSupplierInputPopup = (title: string, apiEndpoint: string) => {
    setCurrentSupplierPopup({ title, apiEndpoint })
    setShowSupplierInputPopup(true)
  }

  const openInventoryInputPopup = (title: string, apiEndpoint: string) => {
    setCurrentInventoryPopup({ title, apiEndpoint })
    if (title.includes('تصنيف')) {
      setShowInventoryCategoryInputPopup(true)
    } else {
      setShowProductMovementInputPopup(true)
    }
  }

  const openExpensesInputPopup = (title: string, apiEndpoint: string) => {
    setCurrentExpensesPopup({ title, apiEndpoint })
    if (title.includes('حساب')) {
      setShowExpensesAccountInputPopup(true)
    } else {
      setShowExpensesPaymentMethodPopup(true)
    }
  }

  const handleInquiryClick = (title: string, id: string) => {
    if (id === 'store-movement') {
      window.location.href = '/inquiries/store-movement'
    } else if (id === 'sales-report') {
      setShowSalesReportsPopup(true)
    } else if (id === 'profits-report') {
      setShowProfitsReportsPopup(true)
    } else if (id === 'discounts-report') {
      setShowDiscountsReportsPopup(true)
    } else if (id === 'credit-invoices-report') {
      generateCreditInvoicesPDF()
    } else if (id === 'returned-sales-report') {
      window.location.href = '/reports'
    } else if (id === 'cancelled-sales-report') {
      generateCancelledSalesPDF()
    } else if (id === 'quotes-report') {
      generateQuotesPDF()
    } else if (id === 'tax-by-category') {
      generateTaxByCategoryPDF()
    } else if (id === 'tax-by-customer') {
      generateTaxByCustomerPDF()
    } else if (id === 'customer-balances') {
      generateCustomerBalancesPDF()
    } else if (id === 'customer-account') {
      setShowCustomerAccountPopup(true)
    } else if (id === 'customer-verification') {
      openCustomerInputPopup('تقرير مصادقة حساب العميل', '/api/reports/customers/verification')
    } else if (id === 'customer-opening-balance') {
      openCustomerInputPopup('تقرير بحركة الرصيد الأفتتاحي و النقد للعميل', '/api/reports/customers/opening-balance')
    } else if (id === 'customer-invoices') {
      openCustomerInputPopup('تقرير بالفواتير لعميل', '/api/reports/customers/invoices')
    } else if (id === 'customer-invoices-total') {
      openCustomerInputPopup('تقرير بالفواتير لعميل - اجمالي', '/api/reports/customers/invoices-total')
    } else if (id === 'customer-returned-invoices') {
      openCustomerInputPopup('تقرير بالفواتير المرتجع لعميل', '/api/reports/customers/returned-invoices')
    } else if (id === 'customer-receipts') {
      openCustomerInputPopup('تقرير بسندات القبض لعميل', '/api/reports/customers/receipts')
    } else if (id === 'customer-payments') {
      openCustomerInputPopup('تقرير بسندات الصرف لعميل', '/api/reports/customers/payments')
    } else if (id === 'customer-settlement') {
      openCustomerInputPopup('تقرير بحركة التسديد لعميل', '/api/reports/customers/settlement')
    } else if (id === 'customer-category-total') {
      openCustomerInputPopup('تقرير اجمالي حسب الصنف لعميل', '/api/reports/customers/category-total')
    } else if (id === 'customer-payment-movement') {
      generatePaymentMovementPDF()
    } else if (id === 'customer-payment-method') {
      setShowPaymentMethodPopup(true)
    } else if (id === 'purchases-report') {
      setShowPurchasesReportsPopup(true)
    } else if (id === 'purchase-invoices') {
      window.location.href = '/purchases-invoices'
    } else if (id === 'returned-purchases-report') {
      generateReturnedPurchasesPDF()
    } else if (id === 'cancelled-purchases-report') {
      generateCancelledPurchasesPDF()
    } else if (id === 'purchase-orders-report') {
      generatePurchaseOrdersPDF()
    } else if (id === 'supplier-balances') {
      generateSupplierBalancesPDF()
    } else if (id === 'supplier-account') {
      setShowSupplierAccountPopup(true)
    } else if (id === 'supplier-opening-balance') {
      openSupplierInputPopup('تقرير بحركة الرصيد الأفتتاحي و النقد للمورد', '/api/reports/suppliers/opening-balance')
    } else if (id === 'supplier-invoices') {
      openSupplierInputPopup('تقرير بالفواتير لمورد', '/api/reports/suppliers/invoices')
    } else if (id === 'supplier-invoices-total') {
      openSupplierInputPopup('تقرير بالفواتير لمورد - اجمالي', '/api/reports/suppliers/invoices-total')
    } else if (id === 'supplier-payments') {
      openSupplierInputPopup('تقرير بسندات الصرف لمورد', '/api/reports/suppliers/payments')
    } else if (id === 'supplier-receipts') {
      openSupplierInputPopup('تقرير بسندات القبض لمورد', '/api/reports/suppliers/receipts')
    } else if (id === 'supplier-settlement') {
      openSupplierInputPopup('تقرير بحركة التسديد لمورد', '/api/reports/suppliers/settlement')
    } else if (id === 'supplier-category-total') {
      openSupplierInputPopup('تقرير اجمالي حسب الصنف لمورد', '/api/reports/suppliers/category-total')
    } else if (id === 'supplier-payment-movement') {
      generateSupplierPaymentMovementPDF()
    } else if (id === 'supplier-payment-method') {
      setShowSupplierPaymentMethodPopup(true)
    } else if (id === 'inventory-count') {
      generateInventoryCountPDF()
    } else if (id === 'inventory-by-category') {
      generateInventoryByCategoryPDF()
    } else if (id === 'inventory-by-category-specific') {
      openInventoryInputPopup('جرد مخزني لتصنيف', '/api/reports/inventory/by-category-specific')
    } else if (id === 'expiry-report') {
      generateExpiryReportPDF()
    } else if (id === 'product-movement') {
      openInventoryInputPopup('تقرير بحركة منتج', '/api/reports/inventory/product-movement')
    } else if (id === 'damaged-products') {
      generateDamagedProductsPDF()
    } else if (id === 'cashbox-movement') {
      generateCashboxMovementPDF()
    } else if (id === 'capital-report') {
      generateCapitalReportPDF()
    } else if (id === 'zakat-calculation') {
      generateZakatCalculationPDF()
    } else if (id === 'tax-declaration') {
      generateTaxDeclarationPDF()
    } else if (id === 'tax-declaration-with-returns') {
      generateTaxDeclarationWithReturnsPDF()
    } else if (id === 'expenses-report') {
      generateExpensesReportPDF()
    } else if (id === 'expenses-by-account') {
      generateExpensesByAccountPDF()
    } else if (id === 'expenses-by-specific-account') {
      openExpensesInputPopup('تقرير بالمصروفات لحساب', '/api/reports/expenses/by-specific-account')
    } else if (id === 'expenses-by-payment-method') {
      setShowExpensesPaymentMethodPopup(true)
    } else if (id === 'sales-invoices') {
      window.location.href = '/reports'
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

  useEffect(() => {
    try { window.history.pushState({ backToHome: true }, '') } catch {}
    const onPop = () => { window.location.assign('/') }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <MainLayout navbarTitle="الاستعلامات" onBack={() => (window.location.href = '/')} menuOptions={[]} removeTopPadding={true}>
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

      <SalesReportsPopup
        isVisible={showSalesReportsPopup}
        onClose={() => setShowSalesReportsPopup(false)}
        onReportSelect={() => {}}
        startDate={startDate}
        endDate={endDate}
      />

      <ProfitsReportsPopup
        isVisible={showProfitsReportsPopup}
        onClose={() => setShowProfitsReportsPopup(false)}
        onReportSelect={() => {}}
        startDate={startDate}
        endDate={endDate}
      />

      <DiscountsReportsPopup
        isVisible={showDiscountsReportsPopup}
        onClose={() => setShowDiscountsReportsPopup(false)}
        onReportSelect={() => {}}
        startDate={startDate}
        endDate={endDate}
      />

      <CustomerAccountPopup
        isVisible={showCustomerAccountPopup}
        onClose={() => setShowCustomerAccountPopup(false)}
        startDate={startDate}
        endDate={endDate}
      />

      <CustomerInputPopup
        isVisible={showCustomerInputPopup}
        onClose={() => {
          setShowCustomerInputPopup(false)
          setCurrentCustomerPopup(null)
        }}
        title={currentCustomerPopup?.title || ''}
        apiEndpoint={currentCustomerPopup?.apiEndpoint || ''}
        startDate={startDate}
        endDate={endDate}
      />

      <PaymentMethodPopup
        isVisible={showPaymentMethodPopup}
        onClose={() => setShowPaymentMethodPopup(false)}
        title="تقرير بحركة السداد للعملاء حسب طريقة الدفع"
        startDate={startDate}
        endDate={endDate}
      />

      <PurchasesReportsPopup
        isVisible={showPurchasesReportsPopup}
        onClose={() => setShowPurchasesReportsPopup(false)}
        onReportSelect={() => {}}
        startDate={startDate}
        endDate={endDate}
      />

      <SupplierAccountPopup
        isVisible={showSupplierAccountPopup}
        onClose={() => setShowSupplierAccountPopup(false)}
        startDate={startDate}
        endDate={endDate}
      />

      <SupplierInputPopup
        isVisible={showSupplierInputPopup}
        onClose={() => {
          setShowSupplierInputPopup(false)
          setCurrentSupplierPopup(null)
        }}
        title={currentSupplierPopup?.title || ''}
        apiEndpoint={currentSupplierPopup?.apiEndpoint || ''}
        startDate={startDate}
        endDate={endDate}
      />

      <SupplierPaymentMethodPopup
        isVisible={showSupplierPaymentMethodPopup}
        onClose={() => setShowSupplierPaymentMethodPopup(false)}
        title="تقرير بحركة السداد للموردين حسب طريقة الدفع"
        startDate={startDate}
        endDate={endDate}
      />

      <InventoryCategoryInputPopup
        isVisible={showInventoryCategoryInputPopup}
        onClose={() => {
          setShowInventoryCategoryInputPopup(false)
          setCurrentInventoryPopup(null)
        }}
        title={currentInventoryPopup?.title || ''}
        apiEndpoint={currentInventoryPopup?.apiEndpoint || ''}
        startDate={startDate}
        endDate={endDate}
      />

      <ProductMovementInputPopup
        isVisible={showProductMovementInputPopup}
        onClose={() => {
          setShowProductMovementInputPopup(false)
          setCurrentInventoryPopup(null)
        }}
        title={currentInventoryPopup?.title || ''}
        apiEndpoint={currentInventoryPopup?.apiEndpoint || ''}
        startDate={startDate}
        endDate={endDate}
      />

      <ExpensesAccountInputPopup
        isVisible={showExpensesAccountInputPopup}
        onClose={() => {
          setShowExpensesAccountInputPopup(false)
          setCurrentExpensesPopup(null)
        }}
        title={currentExpensesPopup?.title || ''}
        apiEndpoint={currentExpensesPopup?.apiEndpoint || ''}
        startDate={startDate}
        endDate={endDate}
      />

      <ExpensesPaymentMethodPopup
        isVisible={showExpensesPaymentMethodPopup}
        onClose={() => setShowExpensesPaymentMethodPopup(false)}
        title="تقرير بالمصروفات حسب طريقة الدفع"
        startDate={startDate}
        endDate={endDate}
      />
    </MainLayout>
  )
}
