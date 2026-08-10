import { useState } from 'react'
import { store } from '../lib/store.js'
import { FEATURES, CLUB } from '../config.js'
import { Button } from './ui.jsx'

/**
 * BRAMKA WEJŚCIA — pierwszy ekran aplikacji.
 * Uczestnik musi podać imię/pseudonim ORAZ hasło zjazdu (inne niż klucz admina).
 * Błędne hasło = brak wejścia do aplikacji.
 * Po zalogowaniu na tym urządzeniu bramka się nie powtarza (flag w storage).
 */
export default function EntryGate({ onEnter }) {
  const [name, setName] = useState(() => store.getNickname() || '')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  const submit = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (n.length < 2) {
      setErr('Podaj imię lub pseudonim (min. 2 znaki).')
      return
    }
    if (!pass) {
      setErr('Podaj hasło wejścia — znajdziesz je u organizatora.')
      return
    }
    if (pass !== FEATURES.appPassword) {
      setErr('Błędne hasło wejścia. Spróbuj ponownie albo zapytaj organizatora.')
      setShakeKey((k) => k + 1)
      return
    }
    store.setNickname(n)
    store.setEntered()
    onEnter()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night px-4">
      {/* dekoracyjna tarcza w tle */}
      <svg viewBox="0 0 100 100" className="animate-spin-slow pointer-events-none fixed -right-10 -top-10 h-48 w-48 opacity-10">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#f5b942" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#f5b942" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#e5484d" strokeWidth="2" />
      </svg>

      <div key={shakeKey} className={`w-full max-w-sm ${shakeKey ? 'rise' : ''}`}>
        {/* logo */}
        <div className="mb-4 text-center">
          <img src="./logo.png" alt="Logo klubu" className="mx-auto h-24 w-24 rounded-full border-2 border-gold/50 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-gold">10-lecie klubu</div>
          <h1 className="mt-1 text-2xl font-black leading-tight">{CLUB.name}</h1>
          <p className="mt-1 text-sm text-muted">{CLUB.eventLabel} • {CLUB.city}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-panel p-5">
          <h2 className="text-lg font-extrabold">Wejście na zjazd</h2>
          <p className="mt-1 text-xs text-muted">
            Podaj pseudonim i hasło zjazdu (dostaniesz je od organizatora). Hasło jest jedno dla wszystkich uczestników.
          </p>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="np. Dartysta Marek"
              autoComplete="nickname"
              className="w-full rounded-2xl border border-white/10 bg-night px-4 py-3.5 text-base outline-none placeholder:text-muted/60 focus:border-gold/60"
            />
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              placeholder="Hasło wejścia"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-night px-4 py-3.5 text-base outline-none placeholder:text-muted/60 focus:border-gold/60"
            />
            {err && <p className="rounded-xl bg-board/15 px-3 py-2 text-sm font-semibold text-red-300">⚠️ {err}</p>}
            <Button type="submit" disabled={!name.trim() || !pass}>Wejdź do aplikacji 🎯</Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted/60">
          Aplikacja na 10-lecie klubu • {CLUB.eventPlace}
        </p>
      </div>
    </div>
  )
}
