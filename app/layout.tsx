import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quadro Tático | gilbertomorales.com',
  description: 'DESC',
  icons: {
      icon: '/favicon.png', 
    },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
