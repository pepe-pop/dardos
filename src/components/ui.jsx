import { Link } from 'react-router-dom'

/** Podstawowe elementy UI zgodne z systemem wizualnym aplikacji. */

export function Card({ children, className = '', onClick, as: Tag = 'div' }) {
  return (
    <Tag
      onClick={onClick}
      className={`rounded-3xl border border-white/5 bg-panel p-4 shadow-lg shadow-black/20 ${onClick ? 'active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

const VARIANTS = {
  gold: 'bg-gold text-night font-bold',
  green: 'bg-verdant text-night font-bold',
  red: 'bg-board text-white font-bold',
  ghost: 'bg-panel2 text-cream border border-white/10',
  outline: 'bg-transparent text-gold border border-gold/40',
}

export function Button({ children, variant = 'gold', className = '', ...props }) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-5 py-3.5 text-base min-h-[48px] active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'gold', className = '' }) {
  const tones = {
    gold: 'bg-gold/15 text-gold border-gold/30',
    green: 'bg-verdant/15 text-emerald-300 border-verdant/30',
    red: 'bg-board/15 text-red-300 border-board/30',
    muted: 'bg-white/5 text-muted border-white/10',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function SectionTitle({ title, sub, className = '' }) {
  return (
    <div className={`mb-3 mt-6 first:mt-0 ${className}`}>
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
    </div>
  )
}

export function NavCard({ to, emoji, title, desc, tone = 'gold' }) {
  return (
    <Link to={to} className="block">
      <Card className="h-full hover:border-gold/30">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${tone === 'green' ? 'bg-verdant/15' : 'bg-gold/15'}`}>
            {emoji}
          </div>
          <div className="min-w-0">
            <div className="font-bold leading-tight">{title}</div>
            <div className="mt-0.5 text-sm text-muted leading-snug">{desc}</div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

/** Mały element „kliknij do powrotu" na podstronach gier */
export function BackLink({ to = '/gry' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-gold">
      ← wróć
    </Link>
  )
}

/** Awatar z inicjałem */
export function Avatar({ name, className = '' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-verdant/20 text-sm font-bold text-emerald-300 ${className}`}>
      {initial}
    </span>
  )
}
