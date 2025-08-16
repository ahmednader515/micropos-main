import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBuildTime, isVercelBuild, buildTimeResponses } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ suppliers })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      supplierNumber, 
      name, 
      address, 
      phone, 
      taxRegistration, 
      commercialRegistration, 
      notes, 
      balance 
    } = body
    
    if (!name || String(name).trim().length === 0) {
      return NextResponse.json({ error: 'اسم المورد مطلوب' }, { status: 400 })
    }

    // Check if supplier number already exists (if provided)
    if (supplierNumber) {
      const existingByNumber = await prisma.supplier.findUnique({ 
        where: { supplierNumber: String(supplierNumber).trim() } 
      })
      if (existingByNumber) {
        return NextResponse.json({ error: 'رقم المورد موجود مسبقاً' }, { status: 400 })
      }
    }

    // Check if name already exists
    const existingByName = await prisma.supplier.findUnique({ where: { name } })
    if (existingByName) {
      return NextResponse.json({ error: 'اسم المورد موجود مسبقاً' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierNumber: supplierNumber ? String(supplierNumber).trim() : null,
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        phone: phone ? String(phone).trim() : null,
        taxRegistration: taxRegistration ? String(taxRegistration).trim() : null,
        commercialRegistration: commercialRegistration ? String(commercialRegistration).trim() : null,
        notes: notes ? String(notes).trim() : null,
        balance: balance != null ? Number(balance) : 0,
      },
    })
    return NextResponse.json({ message: 'تم إنشاء المورد', supplier })
  } catch (e) {
    console.error('Error creating supplier:', e)
    return NextResponse.json({ error: 'فشل إنشاء المورد' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    const updated = await prisma.supplier.update({ where: { id }, data })
    return NextResponse.json({ message: 'تم التحديث', supplier: updated })
  } catch (e) {
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف' })
  } catch (e) {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 })
  }
}


