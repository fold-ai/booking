import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className={`relative flex w-full ${widths[size]} max-h-[90vh] flex-col rounded-3xl bg-ink-50 shadow-pop`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <X size={18} />
        </button>
        {(title || subtitle) && (
          <div className="shrink-0 px-7 pt-7 pr-14">
            {title && <h2 className="font-display text-3xl leading-tight text-ink-800">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 rounded-b-3xl border-t border-ink-100 bg-white px-7 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
