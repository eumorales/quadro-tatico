import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quadro Tático | gilbertomorales.com',
  description: 'Uma aplicação web de quadro tático para planejar e visualizar jogadas de voleibol.',
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
