import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className={`relative w-full ${widths[size]} rounded-3xl bg-ink-50 shadow-pop`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <X size={18} />
        </button>
        <div className="px-7 pt-7">
          {title && <h2 className="font-display text-3xl leading-tight text-ink-800">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
        </div>
        <div className="px-7 py-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 rounded-b-3xl border-t border-ink-100 bg-white px-7 py-4">{footer}</div>}
      </div>
    </div>
  )
}
