import { useMemo, useState } from 'react'
import { TIMELINE } from '../data/timeline.js'
import { store, recordGame, bestFor } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, Badge, BackLink } from '../components/ui.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const YEARS_POOL = TIMELINE.map((t) => t.year)

/** Buduje talię pytań z wydarzeń (oś czasu) i zdjęć z galerii. Tekst stwierdzenia jest PEŁNY (nie ucinamy). */
function buildDeck() {
  const items = []
  TIMELINE.forEach((t) => {
    items.push({
      year: t.year,
      clue: `${t.title}: ${t.text.replace(/\s+/g, ' ')}`,
      kind: 'event',
    })
  })
  const photos = store
    .listPhotos()
    .filter((p) => p.year && p.year !== String(new Date().getFullYear()))
    .slice(0, 6)
  photos.forEach((p) => {
    items.push({ year: p.year, clue: p.caption || 'Zdjęcie z archiwum klubu', kind: 'photo', src: p.src })
  })
  return shuffle(items).slice(0, 10)
}

/** Modal z PEŁNĄ treścią stwierdzenia (dla zdjęć — także z podglądem). */
function ClueModal({ clue, onClose }) {
  if (!clue) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="pop max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Stwierdzenie</p>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-lg text-muted active:scale-95"
          >
            ✕
          </button>
        </div>

        {clue.src && (
          <img src={clue.src} alt="" className="mx-auto mt-3 max-h-64 w-full rounded-2xl object-contain bg-night" />
        )}

        <p className="mt-4 text-base font-bold leading-relaxed text-cream">{clue.text}</p>

        <p className="mt-4 text-center text-xs font-bold text-muted">Który to rok?</p>
      </div>
    </div>
  )
}

export default function GameYear() {
  const myName = store.getNickname()
  const [deck, setDeck] = useState(() => buildDeck())
  const [qIdx, setQIdx] = useState(-1)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [answers, setAnswers] = useState([])
  const [startTs, setStartTs] = useState(0)
  const [isRecord, setIsRecord] = useState(false)
  const [best, setBest] = useState(null)
  const [saved, setSaved] = useState(false)
  const [clueModal, setClueModal] = useState(null)

  // AKTUALNE PYTANIE + OPCJE — hooki muszą być przed wczesnymi returnami!
  const q = qIdx >= 0 && qIdx < deck.length ? deck[qIdx] : null
  const options = useMemo(
    () =>
      q
        ? shuffle([q.year, ...shuffle(YEARS_POOL.filter((y) => y !== q.year)).slice(0, 3)])
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qIdx]
  )

  const start = () => {
    // NOWA GRA = nowa, LOSOWA talia pytań (inne stwierdzenia, nie tylko inna kolejność)
    setDeck(buildDeck())
    setCorrect(0)
    setAnswers([])
    setPicked(null)
    setSaved(false)
    setStartTs(Date.now())
    setQIdx(0)
    bestFor('rok', 'high').then(setBest)
  }

  // modal (fixed overlay) — renderowany w widoku pytania i w podsumowaniu
  const modalEl = clueModal && <ClueModal clue={clueModal} onClose={() => setClueModal(null)} />

  if (deck.length < 2) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="text-center">
          <div className="text-3xl">📅</div>
          <p className="mt-1 font-bold">Za mało materiałów do gry.</p>
          <p className="mt-1 text-sm text-muted">Dodaj zdjęcia z lat do galerii lub uzupełnij oś czasu w src/data/timeline.js.</p>
        </Card>
      </div>
    )
  }

  if (qIdx === -1) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="text-center">
          <div className="text-4xl">📅</div>
          <h1 className="mt-2 text-xl font-black">Zgadnij rok</h1>
          <p className="mt-2 text-sm text-muted">
            Pokażemy Ci wydarzenie lub zdjęcie z historii klubu — Ty zgadujesz, z którego to roku.
            {best != null && <span className="mt-1 block font-bold text-gold">Twój rekord: {best}/{deck.length}</span>}
          </p>
          <Button className="mt-4" onClick={start}>Zaczynamy!</Button>
        </Card>
      </div>
    )
  }

  if (qIdx >= deck.length) {
    const timeSec = Math.round((Date.now() - startTs) / 1000)
    const pct = correct / deck.length
    if (!saved) {
      setSaved(true)
      recordGame({ game: 'rok', author: myName, score: correct, max: deck.length, timeMs: timeSec * 1000, better: 'high' })
        .then((r) => {
          setIsRecord(r.isRecord)
          setBest(Math.max(r.prevBest || 0, correct))
        })
      if (pct >= 0.7) confettiBurst()
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="pop text-center">
          <div className="text-4xl">{pct >= 0.8 ? '🏆' : pct >= 0.5 ? '🎯' : '📅'}</div>
          <h1 className="mt-1 text-2xl font-black">{correct} / {deck.length} poprawnych</h1>
          <p className="mt-1 text-sm text-muted">czas: {Math.floor(timeSec / 60)}:{String(timeSec % 60).padStart(2, '0')}</p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-4" onClick={start}>Zagraj ponownie</Button>
        </Card>
        <Card>
          <h4 className="font-extrabold">Podsumowanie</h4>
          <div className="mt-2 space-y-2">
            {answers.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${a.ok ? 'bg-verdant/10' : 'bg-board/10'}`}>
                <span>{a.ok ? '✔' : '✘'}</span>
                <div className="min-w-0 flex-1">
                  {/* kliknięcie w stwierdzenie → modal z pełną treścią */}
                  <button onClick={() => setClueModal({ text: a.clue, src: a.src })} className="block w-full text-left">
                    <p className="leading-snug text-cream/85 line-clamp-2">{a.clue}</p>
                    <span className="text-[10px] font-bold text-gold underline decoration-dotted underline-offset-2">
                      czytaj całość
                    </span>
                  </button>
                  <p className="mt-0.5 font-bold text-gold">→ rok {a.year}</p>
                  {!a.ok && <p className="text-muted">typowałeś: {a.picked}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        {modalEl}
      </div>
    )
  }

  const answer = (yr) => {
    if (picked !== null) return
    setPicked(yr)
    const ok = yr === q.year
    if (ok) setCorrect((c) => c + 1)
    setAnswers((a) => [...a, { clue: q.clue, year: q.year, picked: yr, ok, src: q.src }])
    setTimeout(() => {
      setPicked(null)
      setQIdx((i) => i + 1)
    }, 650)
  }

  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(qIdx / deck.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-muted">{qIdx + 1}/{deck.length}</span>
      </div>

      <Card className="rise text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Z którego to roku?</p>

        {/* zdjęcie — kliknięcie otwiera modal z pełnym podglądem i podpisem */}
        {q.kind === 'photo' && q.src && (
          <button
            onClick={() => setClueModal({ text: q.clue, src: q.src })}
            className="mt-3 block w-full"
            aria-label="Zobacz stwierdzenie"
          >
            <img src={q.src} alt="" className="mx-auto max-h-52 w-full rounded-2xl object-cover" />
          </button>
        )}

        {/* stwierdzenie — kliknięcie otwiera modal z pełną treścią */}
        <button
          onClick={() => setClueModal({ text: q.clue, src: q.src })}
          className="mt-3 w-full"
          aria-label="Przeczytaj całe stwierdzenie"
        >
          <p className="text-base font-bold leading-snug line-clamp-3">{q.clue}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-gold">
            👁️ <span className="underline decoration-dotted underline-offset-2">Przeczytaj całość</span>
          </span>
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {options.map((yr) => {
          const isPick = picked === yr
          const isGood = yr === q.year
          let cls = 'border-white/10 bg-panel2 hover:border-gold/40'
          if (picked !== null) {
            if (isGood) cls = 'border-verdant bg-verdant/15 text-emerald-200'
            else if (isPick) cls = 'border-board bg-board/15 text-red-200'
            else cls = 'border-white/5 bg-panel2 opacity-50'
          }
          return (
            <button
              key={yr}
              onClick={() => answer(yr)}
              disabled={picked !== null}
              className={`rounded-2xl border px-4 py-4 text-lg font-black transition ${cls}`}
            >
              {yr}
              {picked !== null && isGood && ' ✔'}
              {picked !== null && isPick && !isGood && ' ✘'}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className="text-center text-sm font-bold text-muted">
          {picked === q.year ? 'Dobrze! 🎯' : `To był rok ${q.year}.`}
        </p>
      )}

      {modalEl}
    </div>
  )
}
