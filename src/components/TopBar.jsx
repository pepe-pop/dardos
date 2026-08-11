import { useState } from 'react'
import { Link } from 'react-router-dom'
import { store } from '../lib/store.js'
import { useApp } from '../App.jsx'
import { Avatar } from './ui.jsx'

export default function TopBar() {
  const name = store.getNickname()
  const { openNickname } = useApp()
  const [logoOk, setLogoOk] = useState(true)

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          {/* LOGO KLUBU — zamień plik public/logo.png na własne logo (patrz README → „Gdzie zmienić treści") */}
          {logoOk ? (
            <img
              src="./logo.jpg"
              alt="Logo klubu"
              className="h-9 w-9 rounded-full border border-gold/50 object-cover"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-gold/70 bg-panel text-[11px] font-black text-gold">
              10
            </span>
          )}
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-wide">{name ? 'PeKaeS • 10 lat' : 'Dardos'}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gold">10-lecie</span>
          </span>
        </Link>

        <button
          onClick={openNickname}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-panel py-1 pl-1 pr-3 active:scale-95 transition"
          aria-label="Twój pseudonim"
        >
          <Avatar name={name} />
          <span className="max-w-[110px] truncate text-sm font-semibold">
            {name || 'Podaj imię'}
          </span>
        </button>
      </div>
    </header>
  )
}
