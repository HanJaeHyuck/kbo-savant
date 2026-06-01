import { useState, useCallback, useRef } from 'react'
import { searchPlayers } from '../api/players'
import type { Player } from '../types'

export const usePlayerSearch = () => {
  const [results, setResults] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchPlayers(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  return { results, loading, search }
}
