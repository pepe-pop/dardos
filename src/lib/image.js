/**
 * Kompresja zdjęcia na urządzeniu (canvas) PRZED wysłaniem na serwer.
 * - zmniejsza rozmiar pliku ~10-20× (typowe 2-6 MB → 150-400 KB),
 * - oszczędza darmowe limity (transfer, storage),
 * - skraca czas uploadu na słabym internecie.
 */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

/**
 * Zwraca dataURL (JPEG) skalowanego zdjęcia.
 * @param {File|Blob} file
 * @param {{maxWidth?: number, quality?: number}} opts
 */
export async function compressImage(file, { maxWidth = 1600, quality = 0.75 } = {}) {
  const { img, url } = await loadImage(file)
  try {
    let w = img.naturalWidth || img.width
    let h = img.naturalHeight || img.height
    const scale = Math.min(1, maxWidth / Math.max(w, h))
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: w, height: h }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Formatuje rozmiar bajtów do czytelnego napisu. */
export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
