import { useParams } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import { usePlayer } from '../hooks/usePlayer'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const { player, loading, error } = usePlayer(Number(id))

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[var(--color-text-secondary)]">로딩 중...</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <ErrorMessage type="not_found" />
    </div>
  )

  const p = player as { name: string; team: string; position: string; throws: string; bats: string } | null

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <div className="bg-[#0A2240] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{p?.name}</h1>
            <p className="text-blue-200 text-sm">{p?.team} · {p?.position} · {p?.bats}타 {p?.throws}투</p>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-[var(--color-text-secondary)]">선수 상세 데이터 (Goal 9~10에서 구현)</p>
      </main>
    </div>
  )
}
