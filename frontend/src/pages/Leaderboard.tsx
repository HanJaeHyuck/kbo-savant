import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import { useLeaderboard } from '../hooks/useLeaderboard'

interface LeaderboardData {
  data: { rank: number; player_id: number; name: string; team: string; war: number }[]
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [type, setType] = useState<'batting' | 'pitching'>('batting')
  const [stat, setStat] = useState('war')
  const season = 2024

  const { data, loading } = useLeaderboard({ type, stat, season })

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">리더보드</h1>
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${type === 'batting' ? 'bg-[var(--color-primary-mid)] text-white' : 'bg-white border'}`}
            onClick={() => { setType('batting'); setStat('war') }}
          >타자</button>
          <button
            className={`px-4 py-2 rounded ${type === 'pitching' ? 'bg-[var(--color-primary-mid)] text-white' : 'bg-white border'}`}
            onClick={() => { setType('pitching'); setStat('war') }}
          >투수</button>
        </div>
        {loading && <p className="text-[var(--color-text-secondary)]">로딩 중...</p>}
        {Boolean(data) && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">선수</th>
                  <th className="px-4 py-2 text-left">팀</th>
                  <th className="px-4 py-2 text-right">WAR</th>
                </tr>
              </thead>
              <tbody>
                {(data as LeaderboardData).data.map((row) => (
                  <tr
                    key={row.player_id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/players/${row.player_id}`)}
                  >
                    <td className="px-4 py-2">{row.rank}</td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.team}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.war ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
