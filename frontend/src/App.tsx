import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import PlayerDetail from './pages/PlayerDetail'
import Compare from './pages/Compare'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
