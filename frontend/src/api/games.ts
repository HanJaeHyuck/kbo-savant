import apiClient from './client'
import type { GamesResponse } from '../types'

/** 경기 일정/결과 (KBO 공식 게임센터 실데이터). date 미지정 시 최근 경기일. */
export const getGames = async (date?: string): Promise<GamesResponse> => {
  const { data } = await apiClient.get<GamesResponse>('/api/games', {
    params: date ? { game_date: date } : undefined,
  })
  return data
}

/** 저장된 경기 날짜 목록 (최근순) */
export const getGameDates = async (): Promise<string[]> => {
  const { data } = await apiClient.get<{ dates: string[] }>('/api/games/dates')
  return data.dates
}
