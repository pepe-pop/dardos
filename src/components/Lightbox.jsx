import { useEffect } from 'react'

/** Pełnoekranowy podgląd zdjęcia (lightbox) z podpisem i nawigacją. */
export default function Lightbox({ photo, onClose, onPrev, onNext }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={onClose}>
      {/* górny pasek */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-muted">
          {photo.author} {photo.year && `• ${photo.year}`}
        </span>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl">✕</button>
      </div>

      {/* zdjęcie */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2" onClick={(e) => e.stopPropagation()}>
        {onPrev && (
          <button onClick={onPrev} className="absolute left-1 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg">‹</button>
        )}
        <img src={photo.src} alt={photo.caption || 'zdjęcie'} className="max-h-full max-w-full rounded-xl object-contain" />
        {onNext && (
          <button onClick={onNext} className="absolute right-1 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg">›</button>
        )}
      </div>

      {/* podpis */}
      <div className="px-5 pb-8 pt-2 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-cream/90">{photo.caption || '—'}</p>
        <p className="mt-1 text-xs text-muted">dotknij zdjęcia, aby przejść dalej</p>
      </div>
    </div>
  )
}
