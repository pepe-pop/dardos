import { useState } from 'react'
import { QUIZ } from '../data/quiz.js'
import { store, recordGame } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, BackLink, Badge } from '../components/ui.jsx'

/** Ile pytań losujemy z bazy dla jednej rozgrywki. */
const QUESTIONS_PER_GAME = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function GameQuiz() {
  const myName = store.getNickname()

  // BAZA PYTAŃ może mieć dowolną liczbę pozycji — każdy gracz dostaje
  // LOSOWE 10 pytań (talia budowana raz przy wejściu do gry).
  const [bank] = useState(() => shuffle(QUIZ).slice(0, QUESTIONS_PER_GAME))

  const [startedAt] = useState(() => Date.now())
  const [i, setI] = useState(-1)            // -1 = intro, 0..n-1 pytania, n = wynik
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [isRecord, setIsRecord] = useState(false)

  const total = bank.length

  const start = () => { setI(0); setScore(0); setPicked(null); setDone(false); setIsRecord(false) }

  const answer = (idx) => {
    if (picked !== null) return
    setPicked(idx)
    if (idx === bank[i].correct) setScore((s) => s + 1)
  }

  const next = () => {
    if (i + 1 >= total) {
      const final = score
      setDone(true)
      setI(total)
      recordGame({ game: 'quiz', author: myName, score: final, max: total, timeMs: Date.now() - startedAt, better: 'high' })
        .then((r) => setIsRecord(r.isRecord))
      if (final / total >= 0.8) confettiBurst()
      else if (final >= 1) confettiBurst({ count: 40, duration: 1200 })
    } else {
      setI(i + 1)
      setPicked(null)
    }
  }

  /* ------- INTRO ------- */
  if (i === -1) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="text-center">
          <div className="text-4xl">🧠</div>
          <h1 className="mt-2 text-xl font-black">Quiz „10 lat darta"</h1>
          <p className="mt-2 text-sm text-muted">
            Z bazy {QUIZ.length} pytań wylosujemy Ci <b className="text-gold">{total}</b>. Każdy gracz dostaje inne — bez ściągania! 😉
          </p>
          <Button className="mt-4" onClick={start}>Start 🎯</Button>
        </Card>
      </div>
    )
  }

  /* ------- WYNIK ------- */
  if (done) {
    const pct = Math.round((score / total) * 100)
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="pop text-center">
          <div className="text-4xl">{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '🍺'}</div>
          <h1 className="mt-2 text-2xl font-black">{score} / {total}</h1>
          <p className="mt-1 text-sm text-muted">
            {pct >= 80 ? 'Mistrz darta! Legenda klubu!' : pct >= 50 ? 'Niezły wynik — prawie celujesz w dwudziestkę!' : 'Najważniejsze, że było wesoło. Spróbuj jeszcze raz!'}
          </p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-4" onClick={start}>Zagraj ponownie</Button>
        </Card>
      </div>
    )
  }

  /* ------- PYTANIE ------- */
  const q = bank[i]
  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(i / total) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-muted">{i + 1}/{total}</span>
      </div>

      <Card className="rise">
        <h1 className="text-lg font-extrabold leading-snug">{q.q}</h1>
        <div className="mt-4 space-y-2.5">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct
            const isPicked = picked === idx
            let cls = 'border-white/10 bg-panel2 hover:border-gold/40'
            if (picked !== null) {
              if (isCorrect) cls = 'border-verdant bg-verdant/15 text-emerald-200'
              else if (isPicked) cls = 'border-board bg-board/15 text-red-200'
              else cls = 'border-white/5 bg-panel2 opacity-50'
            }
            return (
              <button key={idx} onClick={() => answer(idx)} disabled={picked !== null}
                className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition ${cls}`}>
                <span className="mr-2 font-black text-muted">{String.fromCharCode(65 + idx)}.</span> {opt}
                {picked !== null && isCorrect && <span className="ml-2">✔</span>}
                {picked !== null && isPicked && !isCorrect && <span className="ml-2">✘</span>}
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <div className="pop mt-4">
            {q.fun && <p className="rounded-2xl bg-gold/10 px-4 py-3 text-sm text-cream/90">💡 {q.fun}</p>}
            <Button className="mt-3" onClick={next}>
              {i + 1 >= total ? 'Zobacz wynik' : 'Następne pytanie'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
