import { useState } from 'react'
import { BINGO_POOL } from '../data/quiz.js'
import { store, recordGame } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, BackLink, Badge } from '../components/ui.jsx'

const N = 5

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCard() {
  const picked = shuffle(BINGO_POOL).slice(0, N * N - 1)
  const grid = []
  let k = 0
  for (let r = 0; r < N; r++) {
    const row = []
    for (let c = 0; c < N; c++) {
      if (r === 2 && c === 2) row.push({ text: '★ FREE', free: true })
      else row.push({ text: picked[k++], free: false })
    }
    grid.push(row)
  }
  return grid
}

function checkWin(grid, marked) {
  let lines = 0
  for (let r = 0; r < N; r++) if (grid[r].every((_, c) => marked.has(`${r}-${c}`))) lines++
  for (let c = 0; c < N; c++) if (grid.every((_, r) => marked.has(`${r}-${c}`))) lines++
  const d1 = Array.from({ length: N }, (_, i) => marked.has(`${i}-${i}`)).every(Boolean)
  const d2 = Array.from({ length: N }, (_, i) => marked.has(`${i}-${N - 1 - i}`)).every(Boolean)
  if (d1) lines++
  if (d2) lines++
  return lines
}

export default function GameBingo() {
  const myName = store.getNickname()
  const [grid, setGrid] = useState(() => buildCard())
  const [marked, setMarked] = useState(() => new Set(['2-2'])) // FREE od startu
  const [won, setWon] = useState(false)
  const [lines, setLines] = useState(0)
  const [isRecord, setIsRecord] = useState(false)

  const toggle = (r, c) => {
    if (won) return
    if (grid[r][c].free) return
    const next = new Set(marked)
    const key = `${r}-${c}`
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setMarked(next)
    const l = checkWin(grid, next)
    if (l > 0) {
      setLines(l)
      setWon(true)
      recordGame({ game: 'bingo', author: myName, score: l, max: 12, timeMs: 0, better: 'high' })
        .then((r) => setIsRecord(r.isRecord))
      confettiBurst({ count: 180 })
    }
  }

  const newCard = () => {
    setGrid(buildCard())
    setMarked(new Set(['2-2']))
    setWon(false)
    setLines(0)
  }

  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Bingo klubowe</h1>
        <Button variant="ghost" className="w-auto px-3 py-2 text-sm" onClick={newCard}>Nowa karta</Button>
      </div>
      <p className="text-sm text-muted">
        Skreślaj hasła, które widzisz (lub słyszysz) podczas zjazdu. Pierwsza pełna linia = BINGO! 🎉
      </p>

      <Card className="!p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`
              const on = marked.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggle(r, c)}
                  disabled={cell.free}
                  className={`flex min-h-[58px] items-center justify-center rounded-lg px-1 py-1.5 text-center text-[9px] font-bold leading-tight transition ${
                    on
                      ? 'bg-gold text-night'
                      : cell.free
                      ? 'bg-verdant/25 text-emerald-200 border border-verdant/30'
                      : 'bg-panel2 text-cream/85 border border-white/10 active:scale-95'
                  }`}
                >
                  {cell.text}
                </button>
              )
            })
          )}
        </div>
      </Card>

      {won && (
        <Card className="pop border-gold/50 text-center">
          <div className="text-4xl">🎉 BINGO!</div>
          <p className="mt-1 text-sm text-muted">Ukończyłeś {lines} {lines === 1 ? 'linię' : lines < 5 ? 'linie' : 'linii'}.</p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-3" onClick={newCard}>Nowa karta</Button>
        </Card>
      )}
    </div>
  )
}
