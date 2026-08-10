import { Link } from 'react-router-dom'
import { store } from '../lib/store.js'
import { Card, SectionTitle } from '../components/ui.jsx'

const GAME_META = {
  quiz: { title: 'Quiz', icon: '🧠', better: 'high', unit: 'pkt' },
  lotka: { title: 'Lotka 501', icon: '🎯', better: 'low', unit: 'rzutów' },
  rok: { title: 'Zgadnij rok', icon: '📅', better: 'high', unit: 'pkt' },
  memory: { title: 'Memory', icon: '🃏', better: 'low', unit: 'ruchów' },
  bingo: { title: 'Bingo klubowe', icon: '🎲', better: 'high', unit: 'linii' },
  kto: { title: 'Kto to powiedział?', icon: '🎭', better: 'high', unit: 'pkt' },
}

function rankResults(results, better, limit = 5) {
  const sorted = [...results]
  if (better === 'low') sorted.sort((a, b) => a.score - b.score || (a.timeMs || 0) - (b.timeMs || 0))
  else sorted.sort((b, a) => a.score - b.score || (a.timeMs || 0) - (b.timeMs || 0))
  return sorted.slice(0, limit)
}

const CARDS = [
  { to: '/gry/quiz', icon: '🧠', title: 'Quiz „10 lat darta"', desc: '10 pytań o klubie i darcie' },
  { to: '/gry/lotka', icon: '🎯', title: 'Lotka 501', desc: 'Double out — zejdź z 501 do zera na podwójnej' },
  { to: '/gry/rok', icon: '📅', title: 'Zgadnij rok', desc: 'Wydarzenia i zdjęcia z historii klubu' },
  { to: '/gry/memory', icon: '🃏', title: 'Memory darta', desc: 'Znajdź pary symboli' },
  { to: '/gry/bingo', icon: '🎲', title: 'Bingo klubowe', desc: 'Skreślaj hasła z życia klubu!' },
]

export default function Games() {
  const results = store.listResults()

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Mini gry</h1>
        <p className="mt-1 text-sm text-muted">Krótkie, wesołe i idealne między rzutami. Powodzenia! 🎯</p>
      </header>

      <div className="space-y-3">
        {CARDS.map((g) => (
          <Link key={g.to} to={g.to} className="block">
            <Card className="flex items-center gap-3 hover:border-gold/30">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-2xl">{g.icon}</span>
              <div className="flex-1">
                <div className="font-bold">{g.title}</div>
                <div className="text-sm text-muted">{g.desc}</div>
              </div>
              <span className="text-muted">→</span>
            </Card>
          </Link>
        ))}
        <Link to="/kto" className="block">
          <Card className="flex items-center gap-3 border-verdant/30 hover:border-verdant/60">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-verdant/15 text-2xl">🎭</span>
            <div className="flex-1">
              <div className="font-bold">Kto to powiedział?</div>
              <div className="text-sm text-muted">Kultowa gra zdań i osób z klubu</div>
            </div>
            <span className="text-muted">→</span>
          </Card>
        </Link>
      </div>

      <SectionTitle title="Ranking lokalny" sub="Najlepsze wyniki na tym urządzeniu" />
      <div className="space-y-3">
        {Object.entries(GAME_META).map(([key, meta]) => {
          const rs = rankResults(results.filter((r) => r.game === key), meta.better)
          return (
            <Card key={key} className="!p-3">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <span>{meta.icon}</span> {meta.title}
              </div>
              {rs.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted">Brak wyników — zagraj!</p>
              ) : (
                <ol className="mt-1.5 space-y-1">
                  {rs.map((r, i) => (
                    <li key={r.id} className="flex items-center gap-2 text-xs">
                      <span className="w-5 font-black text-gold">{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</span>
                      <span className="flex-1 truncate font-semibold">{r.author}</span>
                      <span className="text-muted">
                        {meta.better === 'low'
                          ? `${r.score} ${meta.unit}${r.timeMs ? ` • ${(r.timeMs / 1000).toFixed(0)}s` : ''}`
                          : `${r.score}${r.max ? `/${r.max}` : ''} ${meta.unit}`}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted">
        Rankingu nie resetuj, a zostaniesz legendą tego telefonu 😉
      </p>
    </div>
  )
}
