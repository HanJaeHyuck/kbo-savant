import NavBar from '../components/ui/NavBar'
import PlayerSearchInput from '../components/ui/PlayerSearchInput'
import { useState } from 'react'
import type { Player } from '../types'

export default function Compare() {
  const [playerA, setPlayerA] = useState<Player | null>(null)
  const [playerB, setPlayerB] = useState<Player | null>(null)

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">선수 비교</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">선수 A</p>
            <PlayerSearchInput onSelect={setPlayerA} placeholder="선수 A 검색" />
            {playerA && <p className="mt-2 font-medium text-[#C0392B]">{playerA.name} ({playerA.team})</p>}
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">선수 B</p>
            <PlayerSearchInput onSelect={setPlayerB} placeholder="선수 B 검색" />
            {playerB && <p className="mt-2 font-medium text-[#1E3A8A]">{playerB.name} ({playerB.team})</p>}
          </div>
        </div>
        {playerA && playerB && (
          <p className="text-[var(--color-text-secondary)]">비교 차트 (Goal 11에서 구현)</p>
        )}
      </main>
    </div>
  )
}
