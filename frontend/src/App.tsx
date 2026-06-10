import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SkeletonBlock from './components/ui/SkeletonBlock'

const Home         = lazy(() => import('./pages/Home'))
const Leaderboard  = lazy(() => import('./pages/Leaderboard'))
const PlayerDetail = lazy(() => import('./pages/PlayerDetail'))
const Compare      = lazy(() => import('./pages/Compare'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8"><SkeletonBlock height="400px" /></div>}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/leaderboard"  element={<Leaderboard />} />
          <Route path="/players/:id"  element={<PlayerDetail />} />
          <Route path="/compare"      element={<Compare />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
