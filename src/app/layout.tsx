import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'TalentFlow - Hyper-Local Student Freelancer Marketplace',
  description: 'Connect with verified student freelancers in your neighborhood. Get immediate help for content creation, tech support, errands, and more.',
  keywords: ['freelancer', 'student', 'local services', 'gig economy', 'tasks', 'marketplace'],
  openGraph: {
    title: 'TalentFlow - Hyper-Local Student Freelancer Marketplace',
    description: 'Connect with verified student freelancers in your neighborhood.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${inter.variable}`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
