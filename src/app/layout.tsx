import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TalentFlow - Hyper-Local Student Freelancer Marketplace',
  description: 'Connect with verified student freelancers in your neighborhood. Get immediate help for content creation, tech support, errands, and more.',
  keywords: ['freelance', 'students', 'local services', 'gig economy', 'nearby tasks'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
