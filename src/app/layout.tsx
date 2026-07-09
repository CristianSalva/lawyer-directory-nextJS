import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Lawyer Directory – Find Attorneys Near You',
  description: 'Find qualified attorneys and law firms across the United States.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Self-hosted variable font (see @font-face in globals.css) — the
            Google Fonts CDN chain was the page's biggest render blocker. */}
        <link rel="preload" href="/fonts/open-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
