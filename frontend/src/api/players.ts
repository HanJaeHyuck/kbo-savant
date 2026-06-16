import apiClient from './client'
import type { Player } from '../types'

export const searchPlayers = async (q: string): Promise<Player[]> => {
  const { data } = await apiClient.get<Player[]>('/api/players/search', { params: { q } })
  return data
}

export const getPlayer = async (id: number) => {
  const { data } = await apiClient.get(`/api/players/${id}`)
  return data
}

export const getBattingStats = async (id: number, season: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/batting`, { params: { season } })
  return data
}

export const getPitchingStats = async (id: number, season: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/pitching`, { params: { season } })
  return data
}

export const getPitches = async (id: number, season: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/pitches`, { params: { season } })
  return data
}

export const getBattedBalls = async (id: number, season: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/batted-balls`, { params: { season } })
  return data
}

export const getPitchArsenal = async (id: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/arsenal`)
  return data
}

export const getCareerBatting = async (id: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/career/batting`)
  return data
}

export const getCareerPitching = async (id: number) => {
  const { data } = await apiClient.get(`/api/players/${id}/career/pitching`)
  return data
}
