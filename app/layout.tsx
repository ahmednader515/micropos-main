import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import BackupInitializer from '@/components/BackupInitializer'

const notoSansArabic = Noto_Sans_Arabic({ 
  subsets: ['arabic', 'latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-arabic'
})

export const metadata: Metadata = {
  title: 'microPOS - Point of Sale System',
  description: 'A modern web-based point of sale system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={notoSansArabic.className}>
        <SessionProvider>
          <BackupInitializer />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
} 