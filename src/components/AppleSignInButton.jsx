import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * "Continue with Apple" button for Login / Signup.
 * Mirrors GoogleSignInButton — kicks off the Supabase Apple OAuth flow.
 * Styled per Apple guidelines: black button, white Apple logo.
 *
 * Props:
 *   label       — button text
 *   disabled    — disable
 *   redirectTo  — where to return after success (default /app)
 */
export default function AppleSignInButton({ label = 'Continue with Apple', disabled = false, redirectTo }) {
  const { signInWithApple, supabaseReady } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const click = async () => {
    if (!supabaseReady) return
    setError(''); setBusy(true)
    try {
      const target = redirectTo
        ? (redirectTo.startsWith('http') ? redirectTo : `${window.location.origin}${redirectTo}`)
        : undefined
      await signInWithApple(target)
    } catch (err) {
      setError(err.message || 'Could not start Apple sign-in.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={click}
        disabled={busy || disabled || !supabaseReady}
        className="flex w-full items-center justify-center gap-2.5 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <AppleIcon />
        {busy ? 'Redirecting to Apple…' : label}
      </button>
      {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    </div>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.36 9.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.13.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.11 2.58 2.07 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.7.65 1.12-.02 1.82-1.01 2.5-2.01.79-1.15 1.11-2.27 1.13-2.33-.02-.01-2.17-.83-2.19-3.3M11.3 3.48c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.12"/>
    </svg>
  )
}
