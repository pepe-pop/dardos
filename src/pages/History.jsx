import { useEffect, useState } from 'react'
import { TIMELINE, STATS, QUOTES } from '../data/timeline.js'
import { SectionTitle, Card } from '../components/ui.jsx'

function CountUp({ to, suffix = '', duration = 1300 }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start, raf
    const step = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return (
    <>{v}{suffix}</>
  )
}

export default function History() {
  return (
    <div className="space-y-6">
      <header className="pt-1">
        <h1 className="text-2xl font-black">Nasza historia</h1>
        <p className="mt-1 text-sm text-muted">
          Dziesięć lat przy jednej tarczy. Przewiń oś czasu — każdy rok to kawałek wspólnej drogi.
        </p>
      </header>

      {/* STATYSTYKI */}
      <section>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <div className="text-2xl font-black text-gold">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted leading-tight">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* OŚ CZASU */}
      <section>
        <SectionTitle title="Oś czasu" sub="2k16 -> 2k26" />
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold via-verdant to-board" />
          {TIMELINE.map((y) => (
            <div key={y.year} className="relative">
              <span className="absolute -left-6 top-1.5 grid h-4 w-4 place-items-center">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-gold bg-night" />
              </span>
              <Card className="rise">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-sm font-black text-gold">{y.year}</span>
                  <span className="text-xs font-bold text-cream/80">{y.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-cream/85">{y.text}</p>
                {y.facts && y.facts.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {y.facts.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                        <span className="mt-0.5 text-verdant">✔</span> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {y.quote && (
                  <blockquote className="mt-3 border-l-2 border-gold/60 pl-3 text-sm italic text-cream/90">
                    {y.quote}
                  </blockquote>
                )}
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CYTATY */}
      <section>
        <SectionTitle title="Słowami członków i sympatyków" sub="Jak coś jeszcze macie to priv" />
        <div className="space-y-3">
          {QUOTES.map((q, i) => (
            <Card key={i} className="border-l-4 border-l-gold">
              <p className="text-sm italic leading-relaxed">{q.text}</p>
              <p className="mt-2 text-xs font-bold text-gold">— {q.author}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
