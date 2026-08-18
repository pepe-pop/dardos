import { useEffect, useRef, useState } from 'react'
import { MEMORY_SYMBOLS, MEMORY_IMAGES } from '../data/quiz.js'
import { store, recordGame } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, BackLink, Badge } from '../components/ui.jsx'

/**
 * Memory — obsługuje WŁASNE GRAFIKI (MEMORY_IMAGES w src/data/quiz.js) albo emoji.
 * Karta: { key (identyfikator pary), face: {kind:'emoji', value} | {kind:'img', src} }.
 */
function buildDeck() {
  if (MEMORY_IMAGES && MEMORY_IMAGES.length >= 3) {
    const pairs = MEMORY_IMAGES.slice(0, 8).map((m, i) => ({
      key: 'img-' + i,
      face: { kind: 'img', src: m.src || m, label: m.label || '' },
    }))
    return [...pairs, ...pairs]
      .map((c, i) => ({ id: i, ...c, up: false, done: false }))
      .sort(() => Math.random() - 0.5)
  }
  return [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
    .map((s, i) => ({ id: i, key: 'emoji-' + s, face: { kind: 'emoji', value: s }, up: false, done: false }))
    .sort(() => Math.random() - 0.5)
}

const PAIR_COUNT = () => (MEMORY_IMAGES && MEMORY_IMAGES.length >= 3 ? Math.min(MEMORY_IMAGES.length, 8) : MEMORY_SYMBOLS.length)

function CardFace({ face, small = false }) {
  if (face.kind === 'img') {
    return (
      <img
        src={face.src}
        alt={face.label || 'karta'}
        loading="lazy"
        className={`${small ? 'h-full w-full' : 'h-[calc(100%-8px)] w-[calc(100%-8px)]'} rounded-xl object-cover`}
      />
    )
  }
  return <span className={small ? 'text-xl' : 'text-3xl'}>{face.value}</span>
}

export default function GameMemory() {
  const myName = store.getNickname()
  const [deck, setDeck] = useState(() => buildDeck())
  const [open, setOpen] = useState([])
  const [moves, setMoves] = useState(0)
  const [secs, setSecs] = useState(0)
  const [finished, setFinished] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const lockRef = useRef(false)

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [finished])

  const allDone = deck.every((c) => c.done)

  useEffect(() => {
    if (allDone && !finished) {
      setFinished(true)
      recordGame({ game: 'memory', author: myName, score: moves, max: null, timeMs: secs * 1000, better: 'low' })
        .then((r) => setIsRecord(r.isRecord))
      confettiBurst()
    }
  }, [allDone, finished, moves, secs, myName])

  const flip = (idx) => {
    if (lockRef.current || finished) return
    const c = deck[idx]
    if (c.done || open.includes(idx)) return
    const next = deck.map((x, i) => (i === idx ? { ...x, up: true } : x))
    setDeck(next)
    const o = [...open, idx]
    setOpen(o)
    if (o.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = o
      if (deck[a].key === deck[b].key) {
        lockRef.current = true
        setTimeout(() => {
          setDeck((d) => d.map((x, i) => (i === a || i === b ? { ...x, done: true, up: false } : x)))
          setOpen([])
          lockRef.current = false
        }, 450)
      } else {
        lockRef.current = true
        setTimeout(() => {
          setDeck((d) => d.map((x, i) => (i === a || i === b ? { ...x, up: false } : x)))
          setOpen([])
          lockRef.current = false
        }, 900)
      }
    }
  }

  const reset = () => {
    setDeck(buildDeck())
    setOpen([])
    setMoves(0)
    setSecs(0)
    setFinished(false)
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pairs = PAIR_COUNT()

  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Memory</h1>
        <div className="flex gap-2 text-xs font-bold">
          <span className="rounded-full bg-white/5 px-3 py-1 text-muted">⏱ {mm}:{ss}</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-muted">ruchów: {moves}</span>
        </div>
      </div>
      <p className="text-sm text-muted">
        Znajdź {pairs} par. Im mniej ruchów i czasu — tym lepiej.
        {MEMORY_IMAGES && MEMORY_IMAGES.length >= 3 ? ' Gra własnymi grafikami klubu! 🖼️' : ''}
      </p>

      {finished && (
        <Card className="border-verdant/40 text-center">
          <div className="text-3xl">🎉</div>
          <div className="mt-1 font-extrabold">Mistrz pamięci!</div>
          <p className="text-sm text-muted">{moves} ruchów • {mm}:{ss}</p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-3" onClick={reset}>Zagraj jeszcze raz</Button>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-2.5">
        {deck.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            className={`grid aspect-square place-items-center overflow-hidden rounded-2xl transition-all duration-200 ${
              c.done
                ? 'bg-verdant/15 opacity-60'
                : c.up
                ? 'pop bg-panel2 border border-gold/50'
                : 'bg-panel2 border border-white/10 active:scale-95'
            }`}
          >
            {c.up || c.done ? <CardFace face={c.face} small={c.face.kind === 'img'} /> : <span className="text-3xl">🎯</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
