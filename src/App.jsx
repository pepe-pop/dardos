import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import { store, useStoreVersion } from './lib/store.js'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import NicknameModal from './components/NicknameModal.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
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

function Layout() {
  useStoreVersion()
  const [nickModal, setNickModal] = useState(false)

  // Pierwsze wejście bez pseudonimu → pokaż powitanie z prośbą o imię
  useEffect(() => {
    if (!store.getNickname()) setNickModal(true)
  }, [])

  const openNickname = () => setNickModal(true)

  return (
    <AppCtx.Provider value={{ openNickname }}>
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
