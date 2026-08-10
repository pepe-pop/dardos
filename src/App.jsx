import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import { store, useStoreVersion, isFirebase, loadAll, getLoadError } from './lib/store.js'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import NicknameModal from './components/NicknameModal.jsx'
import EntryGate from './components/EntryGate.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { Button } from './components/ui.jsx'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import Gallery from './pages/Gallery.jsx'
import Games from './pages/Games.jsx'
import GameQuiz from './pages/GameQuiz.jsx'
import GameLotka501 from './pages/GameLotka501.jsx'
import GameYear from './pages/GameYear.jsx'
import GameMemory from './pages/GameMemory.jsx'
import GameBingo from './pages/GameBingo.jsx'
import GameKtoTo from './pages/GameKtoTo.jsx'
import Admin from './pages/Admin.jsx'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

/* Ekran ładowania (tryb Firebase — dane wczytywane z bazy przed startem UI). */
function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-night px-6 text-center">
      <img
        src="./logo.png"
        alt="Logo klubu"
        className="h-24 w-24 rounded-full border-2 border-gold/50 object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div className="mt-5 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      <p className="mt-4 text-sm text-muted">Łączenie z bazą zjazdu…</p>
    </div>
  )
}

/* Czytelny ekran błędu zamiast pustej strony (tryb Firebase). */
function FbErrorScreen({ error, onRetry }) {
  const msg = (error && (error.message || String(error))) || 'nieznany błąd'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-night px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="text-5xl">📡</div>
          <h1 className="mt-3 text-xl font-extrabold">Nie udało się połączyć z bazą</h1>
          <p className="mt-1 text-sm text-muted">Aplikacja nie może wczytać danych z Firebase.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-board/30 bg-panel p-4 text-xs text-red-200">
          <b className="text-red-300">Komunikat:</b> {msg.slice(0, 200)}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-panel p-4 text-xs text-muted">
          <b className="text-cream">Sprawdź (w tej kolejności):</b>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
            <li>W pliku <code>.env</code> (lokalnie) lub w <b>sekretach GitHub</b> (na stronie) wpisane są dane <code>VITE_FIREBASE_*</code> z konsoli Firebase — a nie zostawione puste placeholdery.</li>
            <li>W <code>src/config.js</code> jest <code>storageMode: 'firebase'</code>.</li>
            <li>W konsoli Firebase utworzona jest baza <b>Firestore</b> (zakładka Firestore → „Utwórz bazę danych").</li>
            <li>Wgrany jest reguły: <code>firebase/firestore.rules</code> → Firestore → zakładka <b>Rules</b> oraz <code>firebase/storage.rules</code> → Storage → <b>Rules</b>.</li>
            <li>Po każdej zmianie: <code>npm run build</code> i ponowny push — GitHub wdroży nową wersję.</li>
          </ol>
        </div>

        <Button className="mt-4" onClick={onRetry}>Spróbuj ponownie</Button>
      </div>
    </div>
  )
}

function Layout() {
  useStoreVersion()
  const [entered, setEntered] = useState(() => {
    try { return !!store.getEntered() } catch { return false }
  })
  const [nickModal, setNickModal] = useState(false)

  // Utrzymanie logowania po odświeżeniu: `entered` jest inicjalizowane ZANIM dane
  // z Firebase się załadują (cache pusty → false). Subskrybujemy zmiany store —
  // gdy loadAll() ustawi cache.entered, stan się zsynchronizuje i bramka nie wróci.
  useEffect(() => {
    const un = store.onChange
      ? store.onChange(() => {
          let cur = false
          try { cur = !!store.getEntered() } catch { /* ignore */ }
          setEntered((prev) => (prev === cur ? prev : cur))
        })
      : undefined
    return () => un && un()
  }, [])

  // Tryb Firebase: najpierw wczytaj dane z bazy (ekran ładowania → ekran błędu/UI)
  const [fbState, setFbState] = useState(isFirebase ? 'loading' : 'ready')
  const [fbError, setFbError] = useState(null)

  const retryLoad = () => {
    setFbState('loading')
    loadAll().then((ok) => {
      setFbState(ok ? 'ready' : 'error')
      setFbError(getLoadError())
    })
  }

  useEffect(() => {
    if (!isFirebase) return
    let cancelled = false
    loadAll().then((ok) => {
      if (cancelled) return
      setFbState(ok ? 'ready' : 'error')
      setFbError(getLoadError())
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isFirebase && fbState === 'loading') return <SplashScreen />
  if (isFirebase && fbState === 'error') return <FbErrorScreen error={fbError} onRetry={retryLoad} />

  // Bramka wejścia: bez poprawnego hasła nie ma dostępu do aplikacji
  if (!entered) {
    return <EntryGate onEnter={() => setEntered(true)} />
  }

  return (
    <AppCtx.Provider value={{ openNickname: () => setNickModal(true) }}>
      <div className="min-h-dvh bg-night text-cream pb-24">
        <ScrollTop />
        <TopBar />
        <main className="mx-auto w-full max-w-md px-4 pt-4">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/historia" element={<History />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/gry" element={<Games />} />
              <Route path="/gry/quiz" element={<GameQuiz />} />
              <Route path="/gry/lotka" element={<GameLotka501 />} />
              <Route path="/gry/rok" element={<GameYear />} />
              <Route path="/gry/memory" element={<GameMemory />} />
              <Route path="/gry/bingo" element={<GameBingo />} />
              <Route path="/kto" element={<GameKtoTo />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </main>
        {nickModal && <NicknameModal onClose={() => setNickModal(false)} />}
        <BottomNav />
      </div>
    </AppCtx.Provider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  )
}
