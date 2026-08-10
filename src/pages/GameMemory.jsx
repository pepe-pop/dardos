import { useEffect, useRef, useState } from 'react'
import { MEMORY_SYMBOLS } from '../data/quiz.js'
import { store, recordGame } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, BackLink, Badge } from '../components/ui.jsx'

function buildDeck() {
  return [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
    .map((s, i) => ({ id: i, s, up: false, done: false }))
    .sort(() => Math.random() - 0.5)
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
      if (deck[a].s === deck[b].s) {
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
      <p className="text-sm text-muted">Znajdź {MEMORY_SYMBOLS.length} par. Im mniej ruchów i czasu — tym lepiej.</p>

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
            className={`grid aspect-square place-items-center rounded-2xl text-3xl transition-all duration-200 ${
              c.done
                ? 'bg-verdant/15 opacity-60'
                : c.up
                ? 'pop bg-panel2 border border-gold/50'
                : 'bg-panel2 border border-white/10 active:scale-95'
            }`}
          >
            {c.up || c.done ? c.s : '🎯'}
          </button>
        ))}
      </div>
    </div>
  )
}
