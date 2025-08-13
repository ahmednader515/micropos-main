'use client'

import { useState } from 'react'
import * as ExcelJS from 'exceljs'
import MainLayout from '@/components/MainLayout'

export default function ImportProductsPage() {
  const [rowsPreview, setRowsPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ index: number; error: string }[]>([])

  const parseCSV = async (file: File): Promise<any[]> => {
    const text = await file.text()
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const headers = headerLine.split(',').map((h) => h.trim())
    const rows = lines.map((line) => {
      const cols = line.split(',')
      const obj: any = {}
      headers.forEach((h, i) => (obj[h] = cols[i]))
      return obj
    })
    return rows
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.name.endsWith('.csv')) {
      const rows = await parseCSV(file)
      setRowsPreview(rows.slice(0, 20))
    } else {
      // Try ExcelJS
      try {
        const buf = await file.arrayBuffer()
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buf)
        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) throw new Error('No worksheet found')
        
        const rows: any[] = []
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return // Skip header row
          const rowData: any = {}
          row.eachCell((cell, colNumber) => {
            const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || `col${colNumber}`
            rowData[header] = cell.value
          })
          if (Object.keys(rowData).length > 0) {
            rows.push(rowData)
          }
        })
        
        setRowsPreview(rows.slice(0, 20))
      } catch (err) {
        console.error(err)
        alert('تعذر قراءة ملف Excel. يرجى استخدام CSV.')
      }
    }
  }

  const importNow = async () => {
    if (rowsPreview.length === 0) return alert('لا توجد بيانات')
    setLoading(true)
    try {
      // Normalize numeric fields
      const normalized = rowsPreview.map((r) => ({
        name: r.name || r.اسم || r.productName || '',
        description: r.description || r.وصف || '',
        price: r.price ? Number(r.price) : r.سعر ? Number(r.سعر) : undefined,
        price2: r.price2 ? Number(r.price2) : undefined,
        price3: r.price3 ? Number(r.price3) : undefined,
        costPrice: r.costPrice ? Number(r.costPrice) : undefined,
        stock: r.stock ? Number(r.stock) : undefined,
        minStock: r.minStock ? Number(r.minStock) : undefined,
        barcode: r.barcode || r.باركود || undefined,
        sku: r.sku || undefined,
        categoryName: r.categoryName || r.تصنيف || undefined,
        tax: r.tax ? Number(r.tax) : undefined,
        unit: r.unit || undefined,
      }))
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: normalized, createMissingCategories: true }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'فشل الاستيراد')
      setErrors(j.errors || [])
      alert(`تم استيراد ${j.imported} سجل`)
    } catch (e: any) {
      alert(e.message || 'خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout navbarTitle="استيراد منتجات من Excel/CSV" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        <div className="bg-white p-4 rounded shadow">
          <p className="mb-2 text-sm text-gray-700">الحقول المقترحة: name, description, price, costPrice, stock, barcode, sku, categoryName</p>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} />
        </div>

        {rowsPreview.length > 0 && (
          <div className="bg-white rounded shadow overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rowsPreview[0]).map((k) => (
                    <th key={k} className="px-2 py-1 text-right">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsPreview.map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.keys(rowsPreview[0]).map((k) => (
                      <td key={k} className="px-2 py-1">{String(r[k] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
            {errors.slice(0, 10).map((e, idx) => (
              <div key={idx} className="text-sm">سطر {e.index + 2}: {e.error}</div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={importNow} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'جاري الاستيراد...' : 'استيراد الآن'}
          </button>
        </div>
      </div>
    </MainLayout>
  )
}


