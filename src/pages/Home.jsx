import { useEffect, useState } from 'react'
import { CLUB } from '../config.js'
import { store } from '../lib/store.js'
import { useApp } from '../App.jsx'
import { Card, NavCard, SectionTitle, Button } from '../components/ui.jsx'
import { Link } from 'react-router-dom'

function useNow(ms = 1000) {
  const [n, setN] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setN(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return n
}

/* ─────────────────────────────────────────────────────────────
   Bezpieczne odczyty ze store.
   UWAGA: stary (asynchroniczny) store zwracał Promise zamiast
   wartości — React nie umie wyrenderować Promise/obiektu i rzuca
   "Minified React error #31". Te helpery gwarantują, że do JSX
   trafiają WYŁĄCZNIE stringi/liczby.
   ───────────────────────────────────────────────────────────── */
function asStr(v) {
  return typeof v === 'string' ? v : ''
}
function asNum(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0
}
/** Zwraca obiekt ustawień TYLKO jeśli to zwykły obiekt (nigdy Promise). */
function safeSettings() {
  try {
    const raw = typeof store.getSettings === 'function' ? store.getSettings() : null
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof raw.then !== 'function') return raw
  } catch { /* ignore */ }
  return {}
}

function Countdown({ target }) {
  const now = useNow()
  const diff = target - now
  const past = diff <= 0
  const abs = Math.max(0, diff)
  const d = Math.floor(abs / 86400000)
  const h = Math.floor((abs % 86400000) / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const s = Math.floor((abs % 60000) / 1000)

  if (past) {
    return (
      <Card className="pulse-gold border-gold/40 text-center">
        <div className="text-2xl">🎉</div>
        <div className="mt-1 font-extrabold text-gold">PeKaeS dzisiaj do spodu</div>
        <p className="mt-1 text-sm text-muted">Bawimy się do rana ooo.</p>
      </Card>
    )
  }

  const Box = ({ v, l }) => (
    <div className="flex flex-col items-center rounded-2xl bg-panel2 px-2 py-3">
      <span className="text-2xl font-black tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{l}</span>
    </div>
  )

  return (
    <Card className="border-gold/30">
      <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gold">Do zjazdu zostało</div>
      <div className="grid grid-cols-4 gap-2">
        <Box v={d} l="dni" />
        <Box v={h} l="godz" />
        <Box v={m} l="min" />
        <Box v={s} l="sek" />
      </div>
    </Card>
  )
}

/** Wyróżniony film na stronie głównej. Wybór: ustawienia (panel admina) > CLUB.featuredVideo.
 *  W pełni zabezpieczony — do JSX trafiają tylko stringi (nigdy obiekt/Promise). */
function FeaturedVideo() {
  // 1) ID wyróżnionego filmu (tylko string; ustawienia mogą być Promise/obiektem/null)
  let featuredId = ''
  try {
    const settings = safeSettings()
    const fromSettings = asStr(settings.featuredVideoId)
    featuredId = fromSettings || asStr(CLUB.featuredVideo)
  } catch {
    featuredId = asStr(CLUB.featuredVideo)
  }
  if (!featuredId) return null

  // 2) znajdź film w galerii (photos może być tablicą albo Promise — sprawdzamy)
  let video = null
  try {
    const photos = typeof store.listPhotos === 'function' ? store.listPhotos() : []
    if (Array.isArray(photos)) {
      video = photos.find((p) => p && p.type === 'video' && String(p.id) === featuredId) || null
    }
  } catch {
    video = null
  }
  if (!video) return null

  // 3) do JSX wchodzą WYŁĄCZNIE stringi — to eliminuje błąd #31
  const caption = asStr(video.caption)
  const author = asStr(video.author)
  const year = asStr(video.year)
  const src = asStr(video.src)
  const poster = asStr(video.poster)
  const key = asStr(video.id) || 'featured-video'

  return (
    <section className="overflow-hidden rounded-3xl border border-verdant/30 bg-panel">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-black uppercase tracking-widest text-verdant">🎬 Film zjazdu</span>
        {caption && <span className="truncate pl-3 text-xs text-muted">{caption}</span>}
      </div>
      <video
        key={key}
        src={src}
        poster={poster || undefined}
        controls
        preload="metadata"
        playsInline
        className="mt-2 w-full bg-black"
      />
      <p className="px-4 pb-3 pt-1 text-[11px] text-muted">
        {author} • {year}
      </p>
    </section>
  )
}

export default function Home() {
  const { openNickname } = useApp()
  const target = new Date(CLUB.eventDate).getTime()

  // Bezpieczne odczyty: nigdy Promise/obiekt w JSX (React #31)
  let name = ''
  try { name = asStr(typeof store.getNickname === 'function' ? store.getNickname() : '') } catch { name = '' }
  let count = 0
  try { count = asNum(typeof store.countParticipants === 'function' ? store.countParticipants() : 0) } catch { count = 0 }

  // licznik uczestników: jedna wizyta = jedna "rejestracja" (po urządzeniu);
  // w trybie firebase licznik odświeżany co 30 s z bazy (refreshParticipants)
  useEffect(() => {
    if (store.registerParticipant) store.registerParticipant()
    const refresh = () => { if (store.refreshParticipants) store.refreshParticipants() }
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-4">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-b from-panel2 to-night p-6 text-center">
        {/* dekoracyjna wirująca tarcza */}
        <svg viewBox="0 0 100 100" className="animate-spin-slow pointer-events-none absolute -right-8 -top-8 h-36 w-36 opacity-15">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#f5b942" strokeWidth="1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#f5b942" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="#e5484d" strokeWidth="2" />
          <circle cx="50" cy="50" r="4" fill="#e5484d" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="50" y1="2" x2="50" y2="98" stroke="#f5b942" strokeWidth="0.5" transform={`rotate(${i * 30} 50 50)`} opacity="0.5" />
          ))}
        </svg>

        <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">10-lecie klubu</div>
        <h1 className="mt-2 text-4xl font-black leading-none tracking-tight">
          10 <span className="text-gold">lat</span>
        </h1>
        <p className="mt-2 text-lg font-bold">{CLUB.name}</p>
        <p className="mt-1 text-sm text-muted">{CLUB.eventLabel} • {CLUB.city}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-muted">
          <span className="rounded-full bg-white/5 px-3 py-1">📅 {new Date(CLUB.eventDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">📍 {CLUB.eventPlace}</span>
        </div>

        {!name && (
          <Button variant="outline" className="mt-4" onClick={openNickname}>
            Podaj pseudonim, aby w pełni uczestniczyć
          </Button>
        )}
      </section>

      {/* LICZNIKI */}
      <Countdown target={target} />

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <div className="text-3xl font-black text-gold">{count}</div>
          <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-muted">uczestników<br />na zjeździe</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-black text-verdant">{CLUB.foundedYear}</div>
          <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-muted">rok<br />powstania</div>
        </Card>
      </div>

      {/* 🎬 FILM ZJAZDU — wyróżniony film (wybór: panel admina → Zdjęcia → „Film na start",
          albo CLUB.featuredVideo w src/config.js) */}
      <FeaturedVideo />

      {/* SEKCJE */}
      <SectionTitle title="Co tu znajdziesz?" sub="Wybierz, co Cię interesuje — wszystko działa na telefonie" />
      <div className="grid grid-cols-1 gap-3">
        <NavCard to="/historia" emoji="🗓️" title="Nasza historia" desc="Oś czasu 10 lat, statystyki i cytaty" />
        <NavCard to="/galeria" emoji="📸" title="Galeria" desc="Przeglądaj i dodawaj zdjęcia z zjazdu" />
        <NavCard to="/gry" emoji="🎯" title="Mini gry" desc="Quiz, wirtualna lotka, memory i bingo" />
        <NavCard to="/kto" emoji="🎭" title="Kto to powiedział?" desc="Kultowa gra zdań i osób z klubu" tone="green" />
      </div>

      {/* stopka */}
      <p className="pt-2 text-center text-xs text-muted">
        Aplikacja zjazdowa • dane przechowywane lokalnie
        {name && (
          <>
            {' '}• grasz jako <button onClick={openNickname} className="font-bold text-gold underline decoration-dotted">{name}</button>
          </>
        )}
      </p>
      <p className="text-center text-[11px] text-muted/50">
        <Link to="/admin" className="underline decoration-dotted">dla organizatora</Link>
      </p>
    </div>
  )
}
