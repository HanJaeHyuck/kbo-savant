import { useState, useEffect } from 'react'
import { getPlayer } from '../api/players'

export const usePlayer = (id: number) => {
  const [player, setPlayer] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const p = await getPlayer(id)
        if (!cancelled) setPlayer(p)
      } catch (e) {
        if (!cancelled) setError(e as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return { player, loading, error }
}
