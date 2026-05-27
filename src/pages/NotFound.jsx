import { Link } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6 text-center">
      <Seo title="Page not found | Drevito" description="The page you’re looking for doesn’t exist." noindex />
      <div>
        <h1 className="font-display text-7xl text-ink-800">404</h1>
        <p className="mt-2 text-ink-500">That page wandered off the route sheet.</p>
        <Link to="/" className="btn-accent mt-6">Go home</Link>
      </div>
    </div>
  )
}
