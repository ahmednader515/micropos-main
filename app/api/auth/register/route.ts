import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phone, password, name } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        phone,
        password,
        name,
        role: 'USER'
      }
    })

    return NextResponse.json(
      { message: 'تم إنشاء الحساب بنجاح', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    )
  }
}
