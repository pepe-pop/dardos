import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { store, photoFolders } from '../lib/store.js'
import { FEATURES, CLUB } from '../config.js'
import { Button, Card, Badge, SectionTitle } from '../components/ui.jsx'

/**
 * Panel organizatora: #/admin (klucz w polu lub ?klucz=... w adresie).
 * Zarządzanie zdjęciami (foldery, rok, usuwanie — też zbiorczo),
 * moderacja zdań, sterowanie grą, wyniki, eksport kopii zapasowej.
 */

function Gate({ onOk }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState(false)
  const [params] = useSearchParams()
  const fromUrl = params.get('klucz')

  const tryKey = (k) => {
    if (k === FEATURES.adminKey) onOk()
    else setErr(true)
  }

  useMemo(() => {
    if (fromUrl) tryKey(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="mx-auto mt-10 max-w-sm">
      <div className="text-2xl">🔐</div>
      <h1 className="mt-1 text-lg font-extrabold">Panel organizatora</h1>
      <p className="mt-1 text-sm text-muted">Podaj klucz administratora (w .env / sekretach GitHub, nie w repo).</p>
      <div className="mt-4 space-y-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type="password"
          placeholder="Klucz…"
          className="w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm outline-none focus:border-gold/60"
        />
        {err && <p className="text-sm font-semibold text-red-300">Nieprawidłowy klucz.</p>}
        <Button onClick={() => tryKey(key)}>Wejdź</Button>
      </div>
    </Card>
  )
}

export default function Admin() {
  const [ok, setOk] = useState(false)
  const [tab, setTab] = useState('zdjecia')

  if (!ok) return <Gate onOk={() => setOk(true)} />
  return <Panel tab={tab} setTab={setTab} />
}

/* ================= ZDJĘCIA: zarządzanie folderami (akcje zbiorcze) ================= */
const NEW_FOLDER = '__nowy__'

function PhotoManager() {
  const photos = store.listPhotos()
  const folders = photoFolders(photos)
  const [sel, setSel] = useState(() => new Set())
  const [moveTo, setMoveTo] = useState('')
  const [newFolder, setNewFolder] = useState('')     // nazwa nowego folderu (zbiorczo)
  const [inlineNew, setInlineNew] = useState(null)   // { id, name } — nowy folder przy pojedynczym zdjęciu
  const [note, setNote] = useState('')

  const selectedCount = sel.size

  const toggle = (id) => {
    setSel((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = () => setSel(new Set(photos.map((p) => p.id)))
  const clear = () => setSel(new Set())

  /** Przeniesienie zbiorcze: do istniejącego folderu albo nowego (wpisanego przez admina). */
  const applyMove = async () => {
    if (!selectedCount) return
    let target = moveTo
    if (target === NEW_FOLDER) {
      const t = newFolder.trim()
      if (t.length < 2) {
        setNote('Wpisz nazwę nowego folderu (min. 2 znaki).')
        return
      }
      target = t
    }
    if (!target) return
    try {
      await store.updatePhotos([...sel], { folder: target })
      setSel(new Set())
      setMoveTo('')
      setNewFolder('')
      setNote(`Przeniesiono ${selectedCount} zdjęć do folderu „${target}".`)
    } catch (e) {
      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)} — zmiana nie zapisze się u innych!`)
    }
  }

  const applyYear = async () => {
    if (!selectedCount) return
    const y = (window.prompt(`Nowy rok dla ${selectedCount} zdjęć (np. 2023):`) || '').trim()
    if (!/^\d{4}$/.test(y)) return
    try {
      await store.updatePhotos([...sel], { year: y })
      setSel(new Set())
      setNote(`Zmieniono rok na ${y} dla ${selectedCount} zdjęć.`)
    } catch (e) {
      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)}`)
    }
  }

  const applyDelete = async () => {
    if (!selectedCount) return
    if (!window.confirm(`Usunąć ${selectedCount} zdjęć? Tej operacji nie można cofnąć.`)) return
    try {
      await store.deletePhotos([...sel])
      setSel(new Set())
      setNote(`Usunięto ${selectedCount} zdjęć.`)
    } catch (e) {
      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)}`)
    }
  }

  const moveSingle = async (id, folder) => {
    try {
      await store.updatePhoto(id, { folder })
      setNote(`Przeniesiono zdjęcie do folderu „${folder}".`)
    } catch (e) {
      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)}`)
    }
  }

  const saveInlineNew = async (p) => {
    const n = (inlineNew.name || '').trim()
    if (n.length < 2) {
      setNote('Wpisz nazwę nowego folderu (min. 2 znaki).')
      return
    }
    try {
      await store.updatePhoto(p.id, { folder: n })
      setInlineNew(null)
      setNote(`Przeniesiono zdjęcie do nowego folderu „${n}".`)
    } catch (e) {
      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)}`)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="w-auto px-3 py-2 text-xs" onClick={selectAll}>Zaznacz wszystkie</Button>
          <Button variant="ghost" className="w-auto px-3 py-2 text-xs" onClick={clear}>Odznacz</Button>
          <span className="text-xs font-bold text-gold">zaznaczono: {selectedCount}</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          {/* przenoszenie zbiorcze */}
          <div className="flex items-center gap-2">
            <select
              value={moveTo}
              onChange={(e) => { setMoveTo(e.target.value); if (e.target.value !== NEW_FOLDER) setNewFolder('') }}
              className="flex-1 rounded-2xl border border-white/10 bg-night px-3 py-2.5 text-sm outline-none focus:border-gold/60"
            >
              <option value="">Przenieś do folderu…</option>
              {folders.map((f) => <option key={f} value={f}>{f}</option>)}
              <option value={NEW_FOLDER}>➕ Nowy folder…</option>
            </select>
            <Button
              className="w-auto px-3 py-2.5 text-xs"
              disabled={!selectedCount || !moveTo || (moveTo === NEW_FOLDER && !newFolder.trim())}
              onClick={applyMove}
            >
              {moveTo === NEW_FOLDER ? 'Utwórz i przenieś' : 'Przenieś'}
            </Button>
          </div>

          {/* pole na nazwę nowego folderu (zbiorczo) */}
          {moveTo === NEW_FOLDER && (
            <div className="rise">
              <input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                maxLength={40}
                placeholder="Nazwa nowego folderu, np. Zjazd 2026 lub Liga 2019…"
                className="w-full rounded-2xl border border-gold/40 bg-night px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="w-auto px-3 py-2.5 text-xs" disabled={!selectedCount} onClick={applyYear}>✏️ Zmień rok</Button>
            <Button variant="red" className="w-auto px-3 py-2.5 text-xs" disabled={!selectedCount} onClick={applyDelete}>🗑 Usuń zaznaczone</Button>
          </div>
        </div>

        {note && <p className="mt-2 text-sm font-semibold text-verdant">✓ {note}</p>}
        <p className="mt-2 text-xs text-muted">
          Zdjęcia od uczestników trafiają do folderu <b>{CLUB.jubileeFolder}</b> — tutaj możesz je przenieść do roczników lub usunąć.
        </p>
      </Card>

      {photos.length === 0 ? (
        <Card className="py-6 text-center text-sm text-muted">Brak zdjęć.</Card>
      ) : (
        <div className="space-y-2">
          {photos.map((p) => (
            <Card key={p.id} className="!p-3">
              <div className="flex gap-3">
                <button
                  onClick={() => toggle(p.id)}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-sm ${
                    sel.has(p.id) ? 'border-gold bg-gold text-night' : 'border-white/20 bg-night'
                  }`}
                  aria-label="zaznacz"
                >
                  {sel.has(p.id) ? '✓' : ''}
                </button>
                <img src={p.src} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.author}</p>
                  <p className="line-clamp-2 text-xs text-muted">{p.caption || '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted">rok:</span>
                    <b>{p.year}</b>
                    <span className="text-muted">folder:</span>
                    <select
                      value={inlineNew && inlineNew.id === p.id ? NEW_FOLDER : (p.folder || '')}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === NEW_FOLDER) setInlineNew({ id: p.id, name: '' })
                        else { setInlineNew(null); moveSingle(p.id, v) }
                      }}
                      className="rounded-lg border border-white/10 bg-night px-2 py-1 text-xs outline-none"
                    >
                      {folders.includes(p.folder) ? null : <option value={p.folder}>{p.folder}</option>}
                      {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                      <option value={NEW_FOLDER}>➕ Nowy folder…</option>
                    </select>
                  </div>
                  {/* wpisywanie nazwy nowego folderu (pojedyncze zdjęcie) */}
                  {inlineNew && inlineNew.id === p.id && (
                    <div className="rise mt-2 flex items-center gap-2">
                      <input
                        value={inlineNew.name}
                        onChange={(e) => setInlineNew({ ...inlineNew, name: e.target.value })}
                        maxLength={40}
                        placeholder="Nazwa nowego folderu…"
                        className="min-w-0 flex-1 rounded-lg border border-gold/40 bg-night px-2 py-1.5 text-xs outline-none"
                      />
                      <button
                        onClick={() => saveInlineNew(p)}
                        className="rounded-lg bg-verdant px-3 py-1.5 text-xs font-bold text-night"
                      >
                        Zapisz
                      </button>
                      <button onClick={() => setInlineNew(null)} className="rounded-lg bg-white/10 px-2 py-1.5 text-xs">✕</button>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!window.confirm('Usunąć to zdjęcie?')) return
                    try {
                      await store.deletePhoto(p.id)
                      setNote('Usunięto zdjęcie.')
                    } catch (e) {
                      setNote(`❌ Błąd Firebase: ${(e.message || e).slice(0, 120)}`)
                    }
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full bg-board/15 text-red-300"
                  aria-label="usuń zdjęcie"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================= PANEL ================= */
function Panel({ tab, setTab }) {
  const photos = store.listPhotos()
  const sentences = store.listSentences()
  const results = store.listResults()
  const game = store.getGameStatus()

  const pendingSentences = sentences.filter((s) => s.status === 'pending')

  const exportBackup = () => {
    const data = { exportAt: new Date().toISOString(), photos, sentences, game, results, participants: store.countParticipants() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `darts10-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TABS = [
    ['zdjecia', `📸 Zdjęcia (${photos.length})`],
    ['zdania', `✍️ Zdania${pendingSentences.length ? ` (${pendingSentences.length})` : ''}`],
    ['gra', '🎭 Gra'],
    ['wyniki', '🏆 Wyniki'],
    ['eksport', '💾 Kopia'],
  ]

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Panel organizatora</h1>
        <p className="mt-1 text-sm text-muted">
          Zdjęcia i foldery • moderacja zdań • sterowanie grą • kopia zapasowa.
          Tryb: <Badge tone="green">{FEATURES.storageMode === 'firebase' ? 'Firebase' : 'lokalny (demo)'}</Badge>
        </p>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              tab === id ? 'border-gold bg-gold text-night' : 'border-white/10 bg-panel text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'zdjecia' && <PhotoManager />}

      {/* ---------- ZDANIA ---------- */}
      {tab === 'zdania' && (
        <div className="space-y-4">
          <SectionTitle title="Oczekujące zdania" sub="Do gry trafią tylko zatwierdzone" />
          {pendingSentences.length === 0 ? (
            <Card className="py-6 text-center text-sm text-muted">Brak zdań do moderacji 🎉</Card>
          ) : (
            <div className="space-y-3">
              {pendingSentences.map((s) => (
                <Card key={s.id} className="!p-3">
                  <p className="text-sm italic leading-snug">„{s.text}"</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-gold">— {s.author}</span>
                    <Badge tone="muted">runda {s.round || 1}</Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="green" className="w-auto px-3 py-1.5 text-xs" onClick={() => store.updateSentence(s.id, { status: 'approved' })}>Zatwierdź</Button>
                    <Button variant="red" className="w-auto px-3 py-1.5 text-xs" onClick={() => store.updateSentence(s.id, { status: 'rejected' })}>Odrzuć</Button>
                    <Button variant="ghost" className="w-auto px-3 py-1.5 text-xs" onClick={() => store.deleteSentence(s.id)}>Usuń</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <SectionTitle title="Zatwierdzone" sub="Znajdą się w grze" />
          {sentences.filter((s) => s.status === 'approved').length === 0 ? (
            <Card className="py-6 text-center text-sm text-muted">Brak zatwierdzonych zdań.</Card>
          ) : (
            <div className="space-y-2">
              {sentences.filter((s) => s.status === 'approved').map((s) => (
                <Card key={s.id} className="!p-3">
                  <p className="text-sm leading-snug">„{s.text}"</p>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-verdant">— {s.author}</span>
                      <Badge tone="muted">runda {s.round || 1}</Badge>
                    </div>
                    <button onClick={() => store.deleteSentence(s.id)} className="text-xs font-bold text-red-300">usuń</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- GRA ---------- */}
      {tab === 'gra' && (
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Status gry i rundy" sub={`Aktualna runda: ${game.round || 1}`} />
            <div className="grid grid-cols-3 gap-2">
              {[
                ['collect', 'Zbiórka'],
                ['active', 'Aktywna'],
                ['closed', 'Zakończona'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    if (val === 'collect') {
                      // Zakończona → Zbiórka = NOWA runda (numer +1); z Zbiórki zostajemy w tej samej
                      const nextRound = game.status === 'closed' ? (game.round || 1) + 1 : (game.round || 1)
                      store.setGameStatus({ status: 'collect', round: nextRound })
                    } else if (val === 'active') {
                      store.setGameStatus({ status: 'active', round: game.round || 1 })
                    } else {
                      store.setGameStatus({ status: 'closed' })
                    }
                  }}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                    game.status === val ? 'border-gold bg-gold text-night' : 'border-white/10 bg-panel2 text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              <b>Zbiórka</b> = zbierasz zdania do aktualnej rundy • <b>Aktywna</b> = gracze grają •
              <b> Zakończona</b> = zdania zapisują się do tej rundy. Ponowne wciśnięcie <b>Zbiórka</b> po
              zakończeniu zaczyna <b>nową rundę</b> (numer +1) i zbiórka startuje od nowa.
            </p>
          </Card>

          <Card>
            <label className="text-sm font-bold">Min. liczba zdań do startu</label>
            <input
              type="number"
              min={2}
              max={30}
              value={game.minSentences}
              onChange={(e) => store.setGameStatus({ minSentences: Math.max(2, Number(e.target.value) || 2) })}
              className="mt-2 w-24 rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm outline-none focus:border-gold/60"
            />
          </Card>

          <Card>
            <SectionTitle title="Statystyki" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-panel2 p-3"><span className="text-muted">zdania łącznie: </span><b>{sentences.length}</b></div>
              <div className="rounded-2xl bg-panel2 p-3"><span className="text-muted">zatwierdzone: </span><b>{sentences.filter((s) => s.status === 'approved').length}</b></div>
              <div className="rounded-2xl bg-panel2 p-3"><span className="text-muted">zdjęcia: </span><b>{photos.length}</b></div>
              <div className="rounded-2xl bg-panel2 p-3"><span className="text-muted">uczestnicy: </span><b>{store.countParticipants()}</b></div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------- WYNIKI ---------- */}
      {tab === 'wyniki' && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <Card className="py-6 text-center text-sm text-muted">Brak wyników.</Card>
          ) : (
            <>
              <div className="space-y-2">
                {[...results].reverse().slice(0, 50).map((r) => (
                  <Card key={r.id} className="!p-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Badge tone="muted">{r.game}</Badge>
                      <span className="flex-1 font-bold">{r.author}</span>
                      <span className="font-black text-gold">{r.score}{r.max ? `/${r.max}` : ''}</span>
                      {r.timeMs > 0 && <span className="text-xs text-muted">{(r.timeMs / 1000).toFixed(0)}s</span>}
                    </div>
                  </Card>
                ))}
              </div>
              <Button variant="red" onClick={() => store.clearResults && store.clearResults()}>Wyczyść wszystkie wyniki</Button>
            </>
          )}
        </div>
      )}

      {/* ---------- EKSPORT ---------- */}
      {tab === 'eksport' && (
        <Card>
          <SectionTitle title="Kopia zapasowa" sub="Pobierz wszystkie dane jako plik JSON (archiwum po zjeździe)" />
          <p className="text-sm text-muted">
            Plik zawiera zdjęcia (w trybie lokalnym jako base64), zdania, wyniki i ustawienia gry. W trybie Firebase pobierzesz kopię listy dokumentów — pliki zdjęć są wtedy w Firebase Storage.
          </p>
          <Button className="mt-4" onClick={exportBackup}>Pobierz backup (JSON)</Button>
        </Card>
      )}
    </div>
  )
}
