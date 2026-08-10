import { useEffect, useRef, useState } from 'react'

/** Układ sektorów standardowej tarczy (zgodnie z ruchem wskazówek zegara od góry) */
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

const CX = 110, CY = 110, R = 100
// promienie stref (w jednostkach viewBox 220×220)
const BULL_IN = 7.5, BULL_OUT = 18.7, TR_IN = 58.2, TR_OUT = 62.9, DB_IN = 95.3, DB_OUT = 100

const FLIGHT_MS = 420 // czas lotu lotki

const safeAngle = (a) => (Number.isFinite(a) ? a : 0)

function pt(r, degFromTop) {
  const th = ((degFromTop - 90) * Math.PI) / 180
  return [CX + r * Math.cos(th), CY + r * Math.sin(th)]
}
function wedgePath(r, a0, a1) {
  const [x0, y0] = pt(r, a0)
  const [x1, y1] = pt(r, a1)
  return `M ${CX} ${CY} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`
}
function circlePath(r) {
  return `M ${CX} ${CY - r} a ${r} ${r} 0 1 0 0 ${2 * r} a ${r} ${r} 0 1 0 0 ${-2 * r} Z`
}

/** Punktacja wg położenia na tarczy (viewBox units). `double: true` = pole podwójne / bull (do double out). */
export function scoreAt(x, y) {
  const dx = x - CX, dy = y - CY
  const r = Math.hypot(dx, dy)
  if (r > DB_OUT) return { points: 0, label: 'Poza tarczą — 0', double: false }
  const degC = (Math.atan2(dx, -dy) * 180) / Math.PI + 360 // 0 = góra, zgodnie z zegarem
  const idx = Math.floor(((degC + 9) % 360) / 18) % 20
  const sector = ORDER[idx]
  if (r < BULL_IN) return { points: 50, label: 'Bullseye! 50', double: true } // bull liczy się jak double
  if (r < BULL_OUT) return { points: 25, label: 'Zewnętrzny bull — 25', double: false }
  if (r < TR_IN) return { points: sector, label: `Sektor ${sector}`, double: false }
  if (r < TR_OUT) return { points: sector * 3, label: `Potrójna ${sector} — ${sector * 3}!`, double: false }
  if (r < DB_IN) return { points: sector, label: `Sektor ${sector}`, double: false }
  return { points: sector * 2, label: `Podwójna ${sector} — ${sector * 2}`, double: true }
}

/**
 * Losowe miejsce trafienia w "bliskiej okolicy" kliknięcia (rozrzut 4–11 jednostek).
 * Dzięki temu lotka nie wbija się idealnie w punkt, w który celował użytkownik.
 */
function rollLanding(clickX, clickY) {
  const ang = Math.random() * Math.PI * 2
  const rad = 4 + Math.random() * 7
  const x = clickX + Math.cos(ang) * rad
  const y = clickY + Math.sin(ang) * rad
  return { x, y, ...scoreAt(x, y) }
}

/** Rysunek lotki (grot + korpus + lotki), skierowanej w +X. */
function DartGlyph({ scale = 1 }) {
  return (
    <g transform={`scale(${scale})`}>
      {/* grot */}
      <polygon points="3,0 -3,-2.1 -3,2.1" fill="#e8ecf2" />
      {/* korpus (barrel) */}
      <rect x="-11" y="-2.3" width="8" height="4.6" rx="1.7" fill="#f5b942" stroke="#0a0e15" strokeWidth="0.4" />
      {/* trzonek (shaft) */}
      <rect x="-19" y="-1.2" width="8" height="2.4" fill="#8a93a6" />
      {/* lotki (fletching) — cztery "płetwy" */}
      <polygon points="-19,-1.2 -24,-8.5 -29,-7.5 -26,-1.2" fill="#e5484d" stroke="#0a0e15" strokeWidth="0.3" />
      <polygon points="-19,1.2 -24,8.5 -29,7.5 -26,1.2" fill="#e5484d" stroke="#0a0e15" strokeWidth="0.3" />
      <polygon points="-19,0 -25,-1.6 -30,0 -25,1.6" fill="#b93a3e" stroke="#0a0e15" strokeWidth="0.3" />
    </g>
  )
}

/**
 * Interaktywna tarcza z animowaną lotką.
 * props:
 *   darts   — lotki "wbite" [{x, y, angle, points, label}]
 *   onHit   — (res) => {} po wylądowaniu lotki; res = {x, y, points, label, double, angle}
 *   disabled — blokada rzutów
 */
export default function Dartboard({ darts = [], onHit, disabled = false }) {
  const ref = useRef(null)
  const [flying, setFlying] = useState(null)      // { from, to, res, t0, angle }
  const [flyPos, setFlyPos] = useState(null)
  const rafRef = useRef(null)

  const handle = (e) => {
    if (disabled || flying || !onHit) return
    const rect = ref.current.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 220
    const clickY = ((e.clientY - rect.top) / rect.height) * 220

    const res = rollLanding(clickX, clickY)
    const from = { x: 110, y: 226 } // lotka startuje z dołu tarczy (poza widocznym obszarem)
    const angle = (Math.atan2(res.y - from.y, res.x - from.x) * 180) / Math.PI
    setFlying({ from, to: { x: res.x, y: res.y }, res: { ...res, angle }, t0: performance.now() })
  }

  // animacja lotu
  useEffect(() => {
    if (!flying) return
    const DUR = FLIGHT_MS
    let raf
    const step = (now) => {
      const p = Math.min(1, (now - flying.t0) / DUR)
      const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
      const x = flying.from.x + (flying.to.x - flying.from.x) * e
      const y = flying.from.y + (flying.to.y - flying.from.y) * e
      setFlyPos({ x, y })
      if (p < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setFlyPos(null)
        setFlying(null)
        onHit && onHit(flying.res)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [flying])

  const isBusy = disabled || !!flying

  return (
    <svg
      ref={ref}
      viewBox="0 0 220 220"
      onClick={handle}
      className={`mx-auto w-full max-w-sm select-none ${isBusy ? 'opacity-95' : 'cursor-crosshair'}`}
      role="img"
      aria-label="Tarcza do darta — dotknij, aby rzucić lotką"
    >
      {/* obręcz */}
      <circle cx={CX} cy={CY} r={R + 6} fill="#0d1420" stroke="#2c3c55" strokeWidth="2" />

      {/* sektory */}
      {ORDER.map((n, i) => {
        const fill = i % 2 === 0 ? '#1c2636' : '#e8dcc4'
        return (
          <g key={n} transform={`rotate(${i * 18} ${CX} ${CY})`}>
            <path d={wedgePath(R, -9, 9)} fill={fill} stroke="#0a0e15" strokeWidth="1" />
          </g>
        )
      })}

      {/* pierścienie: potrójny i podwójny */}
      <path d={circlePath(TR_OUT) + circlePath(TR_IN)} fill="#1fa37a" fillRule="evenodd" opacity="0.95" stroke="#0a0e15" strokeWidth="1" />
      <path d={circlePath(DB_OUT) + circlePath(DB_IN)} fill="#1fa37a" fillRule="evenodd" opacity="0.95" stroke="#0a0e15" strokeWidth="1" />

      {/* bull */}
      <circle cx={CX} cy={CY} r={BULL_OUT} fill="#e5484d" stroke="#0a0e15" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={BULL_IN} fill="#f5b942" stroke="#0a0e15" strokeWidth="1" />

      {/* linie pomocnicze */}
      {[TR_IN, TR_OUT, DB_IN, R].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#0a0e15" strokeWidth="1.2" opacity="0.8" />
      ))}

      {/* liczby */}
      {ORDER.map((n, i) => (
        <g key={`n${n}`} transform={`rotate(${i * 18} ${CX} ${CY})`}>
          <text
            x={CX}
            y={CY - 106}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8.5"
            fontWeight="800"
            fill="#f4ead8"
            stroke="#0a0e15"
            strokeWidth="0.5"
            transform={`rotate(${-i * 18} ${CX} ${CY - 106})`}
          >
            {n}
          </text>
        </g>
      ))}

      {/* lecąca lotka */}
      {flyPos && flying && (
        <g transform={`translate(${flyPos.x},${flyPos.y}) rotate(${safeAngle(flying.angle)})`}>
          {/* ślad lotu za lotką */}
          <line x1="-3" y1="0" x2="-16" y2="0" stroke="#f5b942" strokeWidth="0.9" opacity="0.4" strokeDasharray="2 3" />
          <DartGlyph scale={1.25} />
        </g>
      )}

      {/* wbite lotki */}
      {darts.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="5" fill="rgba(0,0,0,0.25)" />
          <g transform={`translate(${d.x},${d.y}) rotate(${safeAngle(d.angle) + (i % 2 ? 5 : -5)})`}>
            <DartGlyph scale={0.92} />
          </g>
          <text x={d.x + 6} y={d.y - 5} fontSize="6.5" fontWeight="800" fill="#f4ead8" stroke="#0a0e15" strokeWidth="0.45">
            {d.points}
          </text>
        </g>
      ))}
    </svg>
  )
}
