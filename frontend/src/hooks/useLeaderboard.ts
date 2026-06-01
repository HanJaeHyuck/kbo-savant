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
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    apiClient.get('/api/leaderboard', { params })
      .then(r => setData(r.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [params.type, params.stat, params.season, params.team, params.page])

  return { data, loading, error }
}
