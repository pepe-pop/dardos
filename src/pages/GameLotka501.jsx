import { useEffect, useState } from 'react'
import Dartboard from '../components/Dartboard.jsx'
import { recordGame, bestFor } from '../lib/store.js'
import { store } from '../lib/store.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, BackLink, Badge } from '../components/ui.jsx'

/** Podpowiedź zejścia (checkout) dla danej liczby punktów. */
function checkoutHint(score) {
  if (score <= 0) return ''
  if (score === 50) return 'Bull (50) kończy grę — celuj w środek! 🎯'
  if (score % 2 === 0 && score / 2 <= 20) return `Zostało ${score} — celuj w PODWÓJNĄ ${score / 2}!`
  if (score <= 40) return `Zostało ${score} — musisz najpierw trafić tak, żeby została liczba parzysta ≤ 40.`
  return `Zostało ${score}. Zejdź do liczby ≤ 40, potem zakończ na polu podwójnym.`
}

/**
 * LOTKA 501 (double out).
 * Zaczynasz z 501 punktów, 3 lotki w turze. Gra kończy się trafieniem w pole
 * podwójne (lub bull = 50) przy zejściu dokładnie do 0. Przekroczenie 0 / zejście
 * do 1 / do 0 bez podwójnej = "bust" — tura przepada, wynik wraca.
 */
export default function GameLotka501() {
  const myName = store.getNickname()
  const [score, setScore] = useState(501)
  const [turnStart, setTurnStart] = useState(501)
  const [dartsInTurn, setDartsInTurn] = useState(0)
  const [darts, setDarts] = useState([])
  const [last, setLast] = useState(null)
  const [status, setStatus] = useState('playing') // playing | won | ended
  const [msg, setMsg] = useState('')
  const [totalDarts, setTotalDarts] = useState(0)
  const [turnNo, setTurnNo] = useState(1)
  const [best, setBest] = useState(null)
  const [isRecord, setIsRecord] = useState(false)
  const [startTs] = useState(() => Date.now())

  useEffect(() => {
    bestFor('lotka', 'low').then(setBest)
  }, [])

  const onHit = async (res) => {
    if (status !== 'playing') return
    const thrown = dartsInTurn + 1
    const newScore = score - res.points
    setDarts((d) => [...d, res])
    setLast(res)

    // WYGRANA: dokładnie 0 przez pole podwójne (lub bull)
    if (newScore === 0 && (res.double || res.points === 50)) {
      const total = totalDarts + 1
      setScore(0)
      setDartsInTurn(thrown)
      setStatus('won')
      const r = await recordGame({ game: 'lotka', author: myName, score: total, max: null, timeMs: Date.now() - startTs, better: 'low' })
      setIsRecord(r.isRecord)
      setBest(r.isRecord ? total : r.prevBest)
      confettiBurst({ count: 220, duration: 3200 })
      return
    }

    // BUST: poniżej 0, do 1, albo do 0 bez podwójnej
    if (newScore < 0 || newScore === 1 || newScore === 0) {
      setScore(turnStart)
      setDartsInTurn(thrown)
      setStatus('ended')
      setMsg(
        newScore === 0
          ? 'Zakończyłeś na 0 BEZ podwójnej — w darcie to bust! Tura przepada.'
          : `Punktacja ${newScore} — poza grą. Wracasz do ${turnStart}.`
      )
      return
    }

    setScore(newScore)
    if (thrown >= 3) {
      setDartsInTurn(3)
      setStatus('ended')
      setMsg('Trzy lotki w turze — następna tura!')
    } else {
      setDartsInTurn(thrown)
    }
  }

  const nextTurn = () => {
    setTurnStart(score)
    setDarts([])
    setDartsInTurn(0)
    setLast(null)
    setMsg('')
    setStatus('playing')
    setTurnNo((t) => t + 1)
  }

  const restart = () => {
    setScore(501)
    setTurnStart(501)
    setDarts([])
    setDartsInTurn(0)
    setLast(null)
    setMsg('')
    setStatus('playing')
    setTotalDarts(0)
    setTurnNo(1)
    setIsRecord(false)
  }

  const hint = checkoutHint(score)

  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Lotka 501</h1>
        <Badge tone={best != null ? 'gold' : 'muted'}>
          rekord: {best != null ? `${best} rzutów` : '—'}
        </Badge>
      </div>
      <p className="text-sm text-muted">
        Zaczynasz od <b className="text-cream">501</b>. Trzy lotki w turze, a na koniec wymagane{' '}
        <b className="text-gold">pole podwójne</b> (lub bull). Przekroczenie 0 = bust!
      </p>

      {/* wynik */}
      <Card className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">Pozostało punktów</div>
        <div className="mt-1 text-6xl font-black tabular-nums text-gold">{score}</div>
        <div className="mt-1 text-xs font-bold text-muted">
          Tura {turnNo} • lotki w turze: {dartsInTurn}/3
        </div>
        {hint && <div className="mt-2 rounded-2xl bg-gold/10 px-3 py-2 text-sm font-semibold text-gold">💡 {hint}</div>}
      </Card>

      {/* tarcza */}
      <Dartboard darts={darts} onHit={onHit} disabled={status !== 'playing'} />

      {/* info o ostatnim rzucie */}
      {last && status === 'playing' && (
        <p className="text-center text-sm font-semibold text-muted">
          Ostatni rzut: <span className="text-cream">{last.label}</span> (−{last.points} pkt)
        </p>
      )}

      {/* zakończenie tury */}
      {status === 'ended' && (
        <Card className="border-board/40">
          <p className="text-sm font-bold text-center">{msg}</p>
          <Button className="mt-3" onClick={nextTurn}>Następna tura</Button>
        </Card>
      )}

      {/* wygrana */}
      {status === 'won' && (
        <Card className="pop border-gold/50 text-center">
          <div className="text-4xl">🎯</div>
          <h3 className="mt-1 text-xl font-black">LOTKA 501 — wygrana!</h3>
          <p className="mt-1 text-sm text-muted">Ukończyłeś grę w {totalDarts} rzutów.</p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-3" onClick={restart}>Zagraj od nowa</Button>
        </Card>
      )}

      <p className="text-center text-xs text-muted">
        Każdy rzut ląduje z lekkim rozrzutem — tak jak na prawdziwej tarczy. 😉
      </p>
    </div>
  )
}
