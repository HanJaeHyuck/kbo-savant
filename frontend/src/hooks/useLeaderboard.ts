import { useState, useEffect } from 'react'
import apiClient from '../api/client'

interface LeaderboardParams {
  type: 'batting' | 'pitching'
  stat: string
  season: number
  team?: string
  page?: number
  per_page?: number
}

export const useLeaderboard = (params: LeaderboardParams) => {
  const { type, stat, season, team, page, per_page } = params
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await apiClient.get('/api/leaderboard', {
          params: { type, stat, season, team, page, per_page },
        })
        if (!cancelled) setData(r.data)
      } catch (e) {
        if (!cancelled) setError(e as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [type, stat, season, team, page, per_page])

  return { data, loading, error }
}
