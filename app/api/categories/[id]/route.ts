import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.$connect()

    const body = await request.json()
    const { name, description } = body
    const { id: categoryId } = await params

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 })
    }

    // Get current category
    const currentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true }
    })

    if (!currentCategory) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
    }

    // Check if category with same name exists under the same parent
    const existing = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        parentId: currentCategory.parentId,
        id: { not: categoryId }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'هذا التصنيف موجود بالفعل في نفس المستوى' }, { status: 400 })
    }

    // Update path if name changed
    let newPath = currentCategory.path
    if (name.trim() !== currentCategory.name) {
      if (currentCategory.parent) {
        newPath = currentCategory.parent.path 
          ? `${currentCategory.parent.path}/${name.trim()}`
          : `${currentCategory.parent.name}/${name.trim()}`
      } else {
        newPath = name.trim()
      }

      // Update paths for all children
      await updateChildrenPaths(categoryId, newPath)
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description ? String(description) : null,
        path: newPath
      },
    })

    await prisma.$disconnect()
    return NextResponse.json({ message: 'تم تحديث التصنيف', category })
  } catch (error) {
    console.error('Failed to update category', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'فشل تحديث التصنيف' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.$connect()

    const { id: categoryId } = await params

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true,
        children: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 })
    }

    // Check if category has products
    if (category.products.length > 0) {
      return NextResponse.json({ 
        error: `لا يمكن حذف التصنيف لأنه يحتوي على ${category.products.length} منتج. يجب نقل المنتجات إلى تصنيف آخر أولاً.` 
      }, { status: 400 })
    }

    // Delete category and all its children recursively
    await deleteCategoryRecursively(categoryId)

    await prisma.$disconnect()
    return NextResponse.json({ message: 'تم حذف التصنيف' })
  } catch (error) {
    console.error('Failed to delete category', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'فشل حذف التصنيف' }, { status: 500 })
  }
}

async function updateChildrenPaths(parentId: string, parentPath: string) {
  const children = await prisma.category.findMany({
    where: { parentId }
  })

  for (const child of children) {
    const newChildPath = `${parentPath}/${child.name}`
    await prisma.category.update({
      where: { id: child.id },
      data: { path: newChildPath }
    })

    // Recursively update grandchildren
    await updateChildrenPaths(child.id, newChildPath)
  }
}

async function deleteCategoryRecursively(categoryId: string) {
  // Get all children
  const children = await prisma.category.findMany({
    where: { parentId: categoryId }
  })

  // Delete all children first
  for (const child of children) {
    await deleteCategoryRecursively(child.id)
  }

  // Delete the category itself
  await prisma.category.delete({
    where: { id: categoryId }
  })
}
