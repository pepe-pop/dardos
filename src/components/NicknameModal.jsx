import { useState } from 'react'
import { store } from '../lib/store.js'
import { Button } from './ui.jsx'

/**
 * Onboarding: imię/pseudonim. Zapisane lokalnie (localStorage / profil urządzenia).
 * Można pominąć i uzupełnić później — bez pseudonimu nie da się dodawać treści.
 */
export default function NicknameModal({ onClose, force = false }) {
  const [name, setName] = useState(store.getNickname() || '')
  const saved = !!store.getNickname()

  const submit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      store.setNickname(trimmed)
      store.registerParticipant()
      onClose && onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="pop w-full max-w-md rounded-t-3xl border border-white/10 bg-panel p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div className="text-3xl">👋</div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="grid h-9 w-9 -mr-2 place-items-center rounded-full bg-white/5 text-lg text-muted active:scale-95"
          >
            ✕
          </button>
        </div>
        <h2 className="text-xl font-extrabold">{saved ? 'Twój pseudonim' : 'Witaj na zjeździe 10-lecia!'}</h2>
        <p className="mt-1 text-sm text-muted">
          Podaj imię lub pseudonim — zobaczą je inni przy zdjęciach, zdaniach i wynikach gier. Zapiszemy je na tym urządzeniu.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="np. Dartysta Marek"
            className="w-full rounded-2xl border border-white/10 bg-night px-4 py-3.5 text-base outline-none placeholder:text-muted/60 focus:border-gold/60"
          />
          <Button type="submit" disabled={!name.trim()}>
            {saved ? 'Zapisz zmiany' : 'Wejdź do aplikacji 🎯'}
          </Button>
          {!saved && (
            <button type="button" onClick={onClose} className="w-full py-2 text-center text-sm font-semibold text-muted">
              Później — tylko pooglądam
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
