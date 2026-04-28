import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="notfound-section">
      <div className="container">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-sub">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>
        <div className="notfound-actions">
          <Link href="/" className="btn-notfound-primary">Go Home</Link>
          <Link href="/attorneys" className="btn-notfound-secondary">Browse Attorneys</Link>
        </div>
      </div>
    </section>
  )
}
