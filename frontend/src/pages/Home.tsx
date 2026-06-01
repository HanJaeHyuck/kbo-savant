import { useNavigate } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import PlayerSearchInput from '../components/ui/PlayerSearchInput'
import type { Player } from '../types'

export default function Home() {
  const navigate = useNavigate()

  const handleSelect = (player: Player) => {
    navigate(`/players/${player.id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-3">
            KBO Savant
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            타구속도·발사각·하드힛% 등 KBO 트래킹 기반 지표 분석 플랫폼
          </p>
        </div>
        <div className="max-w-xl mx-auto">
          <PlayerSearchInput onSelect={handleSelect} placeholder="선수명을 입력하세요 (2글자 이상)" />
        </div>
      </main>
    </div>
  )
}
