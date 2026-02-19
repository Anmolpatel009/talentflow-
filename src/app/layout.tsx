import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves LCP by preventing invisible text
  preload: true,
})

export const metadata: Metadata = {
  title: 'TalentFlow - Hyper-Local Student Freelancer Marketplace',
  description: 'Connect with verified student freelancers in your neighborhood. Get immediate help for content creation, tech support, errands, and more.',
  keywords: ['freelance', 'students', 'local services', 'gig economy', 'nearby tasks'],
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
