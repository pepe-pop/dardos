import { useRef, useState } from 'react'
import { store, photoFolders } from '../lib/store.js'
import { FEATURES, CLUB } from '../config.js'
import { compressImage, formatBytes } from '../lib/image.js'
import { Button, Card } from '../components/ui.jsx'
import Lightbox from '../components/Lightbox.jsx'

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - CLUB.foundedYear + 1 }, (_, i) => String(CLUB.foundedYear + i)).reverse()

/** Modal dodawania zdjęcia: aparat / galeria → kompresja → od razu do galerii (folder jubileuszowy). */
function UploadModal({ onClose }) {
  const name = store.getNickname()
  const fileRef = useRef(null)
  const [raw, setRaw] = useState(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [year, setYear] = useState(String(THIS_YEAR))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const pick = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (f.size > 30 * 1024 * 1024) {
      setError('Plik jest za duży (max 30 MB przed kompresją).')
      return
    }
    setError('')
    setRaw(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!raw || busy) return
    setBusy(true)
    setError('')
    try {
      const full = await compressImage(raw, { maxWidth: FEATURES.photoMaxWidth, quality: FEATURES.photoQuality })
      const thumb = await compressImage(raw, { maxWidth: FEATURES.thumbWidth, quality: FEATURES.thumbQuality })
      await store.addPhoto({
        author: name || 'Anonim',
        caption: caption.trim(),
        year,
        folder: CLUB.jubileeFolder,
        dataUrl: full.dataUrl,
        thumbDataUrl: thumb.dataUrl,
      })
      setDone(true)
    } catch (err) {
      setError('Nie udało się przetworzyć zdjęcia: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="pop max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="text-4xl">📸</div>
            <h3 className="mt-2 text-lg font-extrabold">Dzięki! Zdjęcie już w galerii.</h3>
            <p className="mt-1 text-sm text-muted">
              Trafiło do folderu <b className="text-gold">{CLUB.jubileeFolder}</b>. Organizator może później przenieść je do rocznika.
            </p>
            <Button className="mt-4" onClick={onClose}>OK</Button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-extrabold">Dodaj zdjęcie</h3>
            <p className="mt-0.5 text-xs text-muted">Dodaje: {name || 'bez pseudonimu'} • folder: {CLUB.jubileeFolder}</p>

            {!preview ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => { fileRef.current?.setAttribute('capture', 'environment'); fileRef.current?.click() }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-night p-5 text-center active:scale-[0.98]"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-bold">Zrób zdjęcie</span>
                </button>
                <button
                  onClick={() => { fileRef.current?.removeAttribute('capture'); fileRef.current?.click() }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-night p-5 text-center active:scale-[0.98]"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-bold">Z galerii telefonu</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
              </div>
            ) : (
              <div className="mt-4">
                <img src={preview} alt="podgląd" className="max-h-56 w-full rounded-2xl object-contain bg-night" />
                <p className="mt-1 text-right text-[11px] text-muted">
                  {formatBytes(raw.size)} → po kompresji ok. 150–400 KB
                </p>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={120}
                  placeholder="Podpis (opcjonalnie) — co widać na zdjęciu?"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm outline-none focus:border-gold/60"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-muted">Rok:</span>
                  <select value={year} onChange={(e) => setYear(e.target.value)} className="flex-1 rounded-2xl border border-white/10 bg-night px-3 py-3 text-sm outline-none focus:border-gold/60">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {error && <p className="mt-2 text-sm font-semibold text-red-300">⚠️ {error}</p>}
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={() => { setRaw(null); setPreview(''); }}>Inny plik</Button>
                  <Button onClick={submit} disabled={busy}>{busy ? 'Przetwarzanie…' : 'Dodaj do galerii'}</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Gallery() {
  const photos = store.listPhotos()
  const myName = store.getNickname()
  const [filter, setFilter] = useState('Wszystkie')
  const [lightbox, setLightbox] = useState(null)
  const [upload, setUpload] = useState(false)

  const folders = photoFolders(photos)
  const filters = ['Wszystkie', ...folders, 'Moje']

  const list =
    filter === 'Moje'
      ? photos.filter((p) => p.author === myName)
      : filter === 'Wszystkie'
      ? photos
      : photos.filter((p) => p.folder === filter)

  const open = (i) => setLightbox(i)
  const cur = lightbox != null ? list[lightbox] : null

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Galeria</h1>
          <p className="mt-1 text-sm text-muted">
            Zdjęcia z 10 lat. Dodane przez Was od razu trafiają do folderu <b className="text-gold">{CLUB.jubileeFolder}</b>.
          </p>
        </div>
        <Button className="w-auto px-4 py-2.5 text-sm" onClick={() => setUpload(true)}>+ Dodaj</Button>
      </header>

      {/* filtry folderów */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              filter === f ? 'border-gold bg-gold text-night' : 'border-white/10 bg-panel text-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* siatka */}
      {list.length === 0 ? (
        <Card className="py-10 text-center">
          <div className="text-3xl">🖼️</div>
          <p className="mt-2 font-bold">Brak zdjęć w tej kategorii</p>
          <p className="mt-1 text-sm text-muted">Dodaj pierwsze zdjęcie i pokaż reszcie, co się działo!</p>
        </Card>
      ) : (
        <div className="columns-2 gap-3 [&>*]:mb-3">
          {list.map((p, i) => (
            <button key={p.id} onClick={() => open(i)} className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/5 bg-panel text-left active:scale-[0.99] transition">
              <img src={p.src} alt={p.caption || 'zdjęcie'} loading="lazy" className="w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8">
                {p.caption && <p className="truncate text-xs font-semibold text-cream">{p.caption}</p>}
                <p className="text-[10px] text-cream/70">{p.author} • {p.year}{p.folder ? ` • ${p.folder}` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {cur && (
        <Lightbox
          photo={cur}
          onClose={() => setLightbox(null)}
          onPrev={lightbox > 0 ? () => setLightbox(lightbox - 1) : null}
          onNext={lightbox < list.length - 1 ? () => setLightbox(lightbox + 1) : null}
        />
      )}
      {upload && <UploadModal onClose={() => setUpload(false)} />}
    </div>
  )
}
