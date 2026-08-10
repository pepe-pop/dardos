import { useEffect, useMemo, useRef, useState } from 'react'
import { store, recordGame } from '../lib/store.js'
import { FEATURES } from '../config.js'
import { deviceId } from '../lib/id.js'
import { confettiBurst } from '../lib/confetti.js'
import { Button, Card, Badge, Avatar, SectionTitle } from '../components/ui.jsx'
import { useApp } from '../App.jsx'
import { Link } from 'react-router-dom'

const BANNED = ['kurwa', 'chuj', 'pierdol', 'cipa', 'huj'] // prosta lista — rozszerz według uznania

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ================= FAZA 1: ZBIERANIE ZDAŃ ================= */
function CollectForm() {
  const myName = store.getNickname()
  const { openNickname } = useApp()
  const [name, setName] = useState(myName)
  const [text, setText] = useState('')
  const [hp, setHp] = useState('')          // honeypot — pole dla botów
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const sentences = store.listSentences()
  const sameName = sentences.some((s) => s.author.toLowerCase() === name.trim().toLowerCase())

  const submit = (e) => {
    e.preventDefault()
    if (hp) { setSent(true); return } // bot — udajemy sukces
    const t = text.trim()
    if (name.trim().length < 2) return setErr('Podaj imię lub pseudonim (min. 2 znaki).')
    if (t.length < FEATURES.minSentenceLen) return setErr(`Zdanie musi mieć co najmniej ${FEATURES.minSentenceLen} znaków.`)
    if (t.length > FEATURES.maxSentenceLen) return setErr(`Maksymalnie ${FEATURES.maxSentenceLen} znaków (masz ${t.length}).`)
    if (BANNED.some((w) => t.toLowerCase().includes(w))) return setErr('Treść nie przeszła automatycznej weryfikacji — spróbuj inaczej sformułować.')
    store.setNickname(name)
    store.addSentence({ author: name.trim(), text: t })
    setSent(true)
  }

  if (sent) {
    return (
      <Card className="border-verdant/40 text-center">
        <div className="text-3xl">✅</div>
        <p className="mt-1 font-bold">Twoje zdanie trafiło do organizatora!</p>
        <p className="mt-1 text-sm text-muted">Pojawi się w grze po akceptacji. Zaproś innych do dodania zdań!</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="font-extrabold">Dodaj swoje zdanie ✍️</h3>
      <p className="mt-1 text-xs text-muted">
        Prawdziwe, ale nieoczywiste — najlepiej zabawne. Inni będą zgadywać, że to Ty!
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Imię / pseudonim"
          className="w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm outline-none focus:border-gold/60"
        />
        {sameName && name.trim() && (
          <p className="text-xs font-semibold text-gold">
            ⚠️ Ktoś już używa tego imienia — dodaj inicjał lub ksywkę, żeby gracze Was nie mylili.
          </p>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={FEATURES.maxSentenceLen}
          rows={3}
          placeholder="Zdanie, które na pewno do Ciebie pasuje…"
          className="w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm outline-none focus:border-gold/60"
        />
        {/* honeypot — niewidoczne pole; boty je wypełniają */}
        <input value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{text.trim().length}/{FEATURES.maxSentenceLen} znaków</span>
          <span>min. {FEATURES.minSentenceLen}</span>
        </div>
        {err && <p className="text-sm font-semibold text-red-300">⚠️ {err}</p>}
        <Button type="submit" disabled={!name.trim() || !text.trim()}>Dodaj zdanie</Button>
      </form>
    </Card>
  )
}

/* ================= FAZA 2/3: ROZGRYWKA ================= */
function PlayGame() {
  const myName = store.getNickname()
  const myDevice = deviceId()

  // Tala pytań budowana RAZ przy wejściu do rozgrywki (stabilna w trakcie gry)
  const [deck] = useState(() => {
    const approved = store.listSentences().filter((s) => s.status === 'approved')
    let d = approved.filter((s) => s.deviceId !== myDevice)
    if (d.length === 0) d = approved // ktoś bez zdania — gra wszystkimi
    return shuffle(d)
  })
  const mySentenceInGame = useMemo(
    () => store.listSentences().some((s) => s.deviceId === myDevice && s.status === 'approved'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [qIdx, setQIdx] = useState(-1) // -1 intro, 0..n-1 pytania, n wynik
  const [answers, setAnswers] = useState([])
  const [picked, setPicked] = useState(null)
  const [startTs, setStartTs] = useState(0)
  const [isRecord, setIsRecord] = useState(false)
  const savedRef = useRef(false)

  const q = qIdx >= 0 && qIdx < deck.length ? deck[qIdx] : null

  // opcje odpowiedzi — losowane raz na pytanie (klucz: qIdx).
  // Poprawny autor jest ZAWSZE wśród opcji; reszta to losowi pozostali gracze.
  const options = useMemo(() => {
    if (!q) return []
    const names = [...new Set(deck.map((x) => x.author))]
    const others = names.filter((n) => n !== q.author)
    const candidates = [q.author, ...others].slice(0, 6)
    return shuffle(candidates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx])

  const start = () => {
    savedRef.current = false
    setAnswers([])
    setQIdx(0)
    setPicked(null)
    setStartTs(Date.now())
  }

  // zapis wyniku po zakończeniu
  useEffect(() => {
    if (qIdx < deck.length || deck.length === 0) return
    if (savedRef.current) return
    savedRef.current = true
    const correct = answers.filter((a) => a.ok).length
    const timeSec = Math.round((Date.now() - startTs) / 1000)
    recordGame({ game: 'kto', author: myName, score: correct, max: deck.length, timeMs: timeSec * 1000, better: 'high' })
      .then((r) => setIsRecord(r.isRecord))
    if (correct / deck.length >= 0.7) confettiBurst()
  }, [qIdx, deck.length, answers, myName, startTs])

  if (deck.length < 2) {
    return (
      <Card className="text-center">
        <div className="text-3xl">⏳</div>
        <p className="mt-1 font-bold">Za mało zdań do gry.</p>
        <p className="mt-1 text-sm text-muted">Organizator uruchomi grę, gdy zbierze się ich wystarczająco dużo.</p>
      </Card>
    )
  }

  if (qIdx === -1) {
    return (
      <Card className="text-center">
        <div className="text-3xl">🎭</div>
        <h3 className="mt-1 text-lg font-extrabold">Kto to powiedział?</h3>
        <p className="mt-1 text-sm text-muted">
          {deck.length} zdań od klubowiczów. Zgadnij, do kogo należą! Im szybciej i trafniej — tym wyżej w rankingu.
          {mySentenceInGame && <span> Twojego zdania nie ma w zestawie — grałbyś w ciemno. 😉</span>}
        </p>
        <Button className="mt-4" onClick={start}>Zaczynamy!</Button>
      </Card>
    )
  }

  if (qIdx >= deck.length) {
    const correct = answers.filter((a) => a.ok).length
    const timeSec = Math.round((Date.now() - startTs) / 1000)
    return (
      <div className="space-y-4">
        <Card className="pop text-center">
          <div className="text-4xl">{correct / deck.length >= 0.8 ? '🏆' : correct / deck.length >= 0.5 ? '🎯' : '🍺'}</div>
          <h3 className="mt-1 text-2xl font-black">{correct} / {deck.length} poprawnych</h3>
          <p className="mt-1 text-sm text-muted">czas: {Math.floor(timeSec / 60)}:{String(timeSec % 60).padStart(2, '0')}</p>
          {isRecord && <Badge tone="green" className="mt-2">🏆 Nowy rekord!</Badge>}
          <Button className="mt-3" onClick={start}>Zagraj ponownie</Button>
        </Card>
        <Card>
          <h4 className="font-extrabold">Podsumowanie</h4>
          <div className="mt-2 space-y-2">
            {answers.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${a.ok ? 'bg-verdant/10' : 'bg-board/10'}`}>
                <span>{a.ok ? '✔' : '✘'}</span>
                <div className="min-w-0 flex-1">
                  <p className="leading-snug text-cream/85">„{a.text}"</p>
                  <p className="mt-0.5 font-bold text-gold">→ to {a.author}</p>
                  {!a.ok && <p className="text-muted">zgadywałeś: {a.picked}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const answer = (name) => {
    if (picked !== null) return
    setPicked(name)
    setAnswers((a) => [...a, { text: q.text, author: q.author, picked: name, ok: name === q.author }])
    setTimeout(() => {
      setPicked(null)
      setQIdx((i) => i + 1)
    }, 550)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(qIdx / deck.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-muted">{qIdx + 1}/{deck.length}</span>
      </div>

      <Card className="rise text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Kto to powiedział?</p>
        <p className="mt-3 text-lg font-bold leading-snug">„{q.text}"</p>
      </Card>

      <div id="kto-options" className="space-y-2.5">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => answer(n)}
            disabled={picked !== null}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-bold transition ${
              picked === n
                ? n === q.author
                  ? 'border-verdant bg-verdant/15 text-emerald-200'
                  : 'border-board bg-board/15 text-red-200'
                : 'border-white/10 bg-panel2 hover:border-gold/40'
            } ${picked !== null && picked !== n ? 'opacity-50' : ''}`}
          >
            <Avatar name={n} />
            <span className="flex-1">{n}</span>
            {picked === n && <span>{n === q.author ? '✔' : '✘'}</span>}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className="text-center text-sm font-bold text-muted">
          {picked === q.author ? 'Dobrze! 🎯' : `To był(a) ${q.author}`}
        </p>
      )}
    </div>
  )
}

/* ================= STRONA GŁÓWNA MODUŁU ================= */
export default function GameKtoTo() {
  const myName = store.getNickname()
  const { openNickname } = useApp()
  const game = store.getGameStatus()
  const sentences = store.listSentences()
  const approved = sentences.filter((s) => s.status === 'approved')
  const pending = sentences.filter((s) => s.status === 'pending')
  const myDevice = deviceId()
  const mySentence = sentences.find((s) => s.deviceId === myDevice)

  const results = store.listResults().filter((r) => r.game === 'kto')
  const top = [...results].sort((b, a) => a.score - b.score || (a.timeMs || 0) - (b.timeMs || 0)).slice(0, 10)

  const active = game.status === 'active'

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Kto to powiedział? 🎭</h1>
        <p className="mt-1 text-sm text-muted">
          Każdy dodaje jedno prawdziwe, zabawne zdanie o sobie — reszta zgaduje, kto je napisał.
        </p>
      </header>

      {!myName && (
        <Card className="border-gold/30">
          <p className="text-sm text-muted">Żeby wziąć udział, podaj pseudonim:</p>
          <Button className="mt-2" variant="outline" onClick={openNickname}>Ustaw pseudonim</Button>
        </Card>
      )}

      {/* status zbiórki */}
      <Card>
        <div className="flex items-center justify-between">
          <Badge tone={active ? 'green' : 'gold'}>{active ? 'Gra AKTYWNA' : 'Trwa zbiórka zdań'}</Badge>
          <span className="text-xs font-bold text-muted">{approved.length}/{game.minSentences} zdań</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-verdant transition-all" style={{ width: `${Math.min(100, (approved.length / game.minSentences) * 100)}%` }} />
        </div>
        {!active && (
          <p className="mt-2 text-xs text-muted">
            Gra ruszy, gdy zbierzemy {game.minSentences} zatwierdzonych zdań lub gdy uruchomi ją organizator.
            {pending.length > 0 && ' Czekają na akceptację — poinformuj organizatora.'}
          </p>
        )}
      </Card>

      {/* moje zdanie */}
      {myName && !active && !mySentence && <CollectForm />}
      {myName && mySentence && mySentence.status === 'pending' && (
        <Card className="text-center">
          <div className="text-2xl">⏳</div>
          <p className="mt-1 font-bold">Twoje zdanie czeka na akceptację organizatora.</p>
          <p className="mt-1 text-xs text-muted">„{mySentence.text}"</p>
        </Card>
      )}
      {myName && mySentence && mySentence.status === 'approved' && (
        <Card className="border-verdant/30 text-center">
          <div className="text-2xl">✅</div>
          <p className="mt-1 font-bold">Twoje zdanie jest już w grze!</p>
          <p className="mt-1 text-xs text-muted">„{mySentence.text}"</p>
        </Card>
      )}
      {myName && mySentence && mySentence.status === 'rejected' && (
        <Card className="border-board/40 text-center">
          <div className="text-2xl">🚫</div>
          <p className="mt-1 font-bold">Twoje zdanie nie przeszło moderacji.</p>
          <p className="mt-1 text-xs text-muted">Możesz je usunąć i dodać inne.</p>
          <Button variant="red" className="mt-3" onClick={() => store.deleteSentence(mySentence.id)}>Usuń i dodaj nowe</Button>
        </Card>
      )}

      {/* gra */}
      {active && (
        <div>
          <SectionTitle title="Rozgrywka" sub={myName ? `Grasz jako ${myName}` : 'Ustaw pseudonim, aby zapisać wynik'} />
          {myName ? <PlayGame /> : (
            <Card className="text-center">
              <p className="text-sm text-muted">Bez pseudonimu nie zapiszesz wyniku do rankingu.</p>
              <Button className="mt-3" variant="outline" onClick={openNickname}>Ustaw pseudonim</Button>
            </Card>
          )}
        </div>
      )}

      {/* ranking */}
      <SectionTitle title="Ranking" sub="Poprawne odpowiedzi, potem czas" />
      {top.length === 0 ? (
        <Card className="py-6 text-center text-sm text-muted">Brak wyników — bądź pierwszy!</Card>
      ) : (
        <Card className="!p-2">
          <ol className="divide-y divide-white/5">
            {top.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-7 text-center text-lg">
                  {['🥇', '🥈', '🥉'][i] || <span className="text-sm font-black text-muted">{i + 1}.</span>}
                </span>
                <span className="flex-1 font-bold">{r.author}</span>
                <span className="text-sm font-black text-gold">{r.score}/{r.max}</span>
                <span className="text-xs text-muted">{Math.floor((r.timeMs || 0) / 1000)}s</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <p className="text-center text-[11px] text-muted/60">
        <Link to="/admin" className="underline decoration-dotted">organizator: panel zarządzania</Link>
      </p>
    </div>
  )
}
