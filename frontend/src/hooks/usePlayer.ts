import { useState, useEffect } from 'react'
import { getPlayer } from '../api/players'

export const usePlayer = (id: number) => {
  const [player, setPlayer] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    getPlayer(id)
      .then(setPlayer)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  return { player, loading, error }
}
