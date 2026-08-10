/**
 * Lekki confetti na canvasie — bez bibliotek zewnętrznych.
 * Użycie: confettiBurst() po zwycięstwie / dobrym wyniku.
 */
export function confettiBurst({ duration = 2600, count = 120, colors = ['#f5b942', '#e5484d', '#1fa37a', '#f4ead8', '#ffd166'] } = {}) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')
  const parts = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height * 0.3,
    vx: (Math.random() - 0.5) * 14,
    vy: -(6 + Math.random() * 12),
    g: 0.35 + Math.random() * 0.2,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 8,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 1,
  }))
  const start = performance.now()
  function frame(now) {
    const t = now - start
    const progress = t / duration
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of parts) {
      p.vy += p.g
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.alpha = Math.max(0, 1 - progress * 1.4)
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (t < duration) {
      requestAnimationFrame(frame)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(frame)
}
