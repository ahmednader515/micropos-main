import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { BackupService } = await import('@/lib/backupService')
    const backupService = new BackupService()
    const result = await backupService.performFullBackup()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        fileId: result.fileId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء إنشاء النسخة الاحتياطية'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { BackupService } = await import('@/lib/backupService')
    const backupService = new BackupService()
    const result = await backupService.listBackups()

    if (result.success) {
      return NextResponse.json({
        success: true,
        backups: result.files
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('List backups API error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء جلب قائمة النسخ الاحتياطية'
    }, { status: 500 })
  }
}
