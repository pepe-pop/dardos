import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Start', emoji: '🏠', end: true },
  { to: '/historia', label: 'Historia', emoji: '🗓️' },
  { to: '/galeria', label: 'Galeria', emoji: '📸' },
  { to: '/gry', label: 'Gry', emoji: '🎯' },
  { to: '/kto', label: 'Kto to?', emoji: '🎭' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-night/90 backdrop-blur-md">
      <div className="pb-safe mx-auto flex w-full max-w-md items-stretch justify-around">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-bold transition ${
                isActive ? 'text-gold' : 'text-muted active:text-cream'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>{t.emoji}</span>
                <span>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
