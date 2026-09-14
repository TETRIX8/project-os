import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const _inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap' })
const _mono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: '$300 за 30 дней — практический курс для новичков-программистов',
    template: '%s — $300 за 30 дней',
  },
  description:
    'Система обучения для программистов-новичков: от выбора направления до первого клиента, первого заказа и собственного MVP. 25 уроков, 6 уровней, проверка заданий куратором.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1c1c22',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark bg-background">
      <body className="antialiased min-h-dvh">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'bg-popover text-popover-foreground border-border',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
