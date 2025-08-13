import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// We accept JSON array produced from client-parsed xlsx/csv for simplicity
// Each record can include: name, description, price, costPrice, stock, barcode, sku, categoryName

type ImportProduct = {
  name: string
  description?: string
  price?: number
  price2?: number
  price3?: number
  costPrice?: number
  stock?: number
  minStock?: number
  barcode?: string
  sku?: string
  categoryName?: string
  tax?: number
  unit?: string
}

type ImportPayload = {
  rows: ImportProduct[]
  createMissingCategories?: boolean
}

export async function POST(request: Request) {
  if (isBuildTime() || isVercelBuild()) {
    return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 })
  }

  try {
    const { rows, createMissingCategories = true } = (await request.json()) as ImportPayload
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }

    // Basic validation + normalization
    const errors: Array<{ index: number; error: string }> = []
    const cleaned: Array<ImportProduct & { categoryId?: string | null }> = []

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]
      if (!r || !r.name || String(r.name).trim().length === 0) {
        errors.push({ index: i, error: 'اسم المنتج مطلوب' })
        continue
      }
      const item: ImportProduct & { categoryId?: string | null } = {
        name: String(r.name).trim(),
        description: r.description ? String(r.description) : undefined,
        price: r.price != null ? Number(r.price) : 0,
        price2: r.price2 != null ? Number(r.price2) : 0,
        price3: r.price3 != null ? Number(r.price3) : 0,
        costPrice: r.costPrice != null ? Number(r.costPrice) : 0,
        stock: r.stock != null ? Number(r.stock) : 0,
        minStock: r.minStock != null ? Number(r.minStock) : 0,
        barcode: r.barcode ? String(r.barcode) : undefined,
        sku: r.sku ? String(r.sku) : undefined,
        tax: r.tax != null ? Number(r.tax) : 0,
        unit: r.unit ? String(r.unit) : undefined,
        categoryName: r.categoryName ? String(r.categoryName).trim() : undefined,
      }
      cleaned.push(item)
    }

    if (cleaned.length === 0) {
      return NextResponse.json({ imported: 0, errors })
    }

    await prisma.$connect()

    // Map category names to ids
    const categoryNameSet = new Set(
      cleaned.map((c) => c.categoryName).filter((n): n is string => Boolean(n))
    )
    const categoryNameArr = Array.from(categoryNameSet)
    const existingCategories = await prisma.category.findMany({
      where: { name: { in: categoryNameArr } },
      select: { id: true, name: true },
    })
    const nameToId = new Map(existingCategories.map((c) => [c.name, c.id]))

    if (createMissingCategories) {
      const missing = categoryNameArr.filter((n) => !nameToId.has(n))
      if (missing.length > 0) {
        const created = await prisma.$transaction(
          missing.map((n) => prisma.category.create({ data: { name: n } }))
        )
        for (const c of created) nameToId.set(c.name, c.id)
      }
    }

    // Prepare creates; use upsert by unique name
    const ops = cleaned.map((c, idx) => {
      const categoryId = c.categoryName ? nameToId.get(c.categoryName) ?? null : null
      const data = {
        name: c.name,
        description: c.description ?? '',
        price: c.price ?? 0,
        price2: c.price2 ?? 0,
        price3: c.price3 ?? 0,
        costPrice: c.costPrice ?? 0,
        stock: c.stock ?? 0,
        minStock: c.minStock ?? 0,
        barcode: c.barcode ?? null,
        sku: c.sku ?? null,
        categoryId,
        tax: c.tax ?? 0,
        unit: c.unit ?? null,
        isActive: true,
      }
      return prisma.product.upsert({
        where: { name: c.name },
        update: data,
        create: data,
      })
    })

    const results = await prisma.$transaction(ops)
    await prisma.$disconnect()

    return NextResponse.json({ imported: results.length, errors })
  } catch (error) {
    console.error('Import products failed', error)
    return NextResponse.json({ error: 'فشل استيراد المنتجات' }, { status: 500 })
  }
}


