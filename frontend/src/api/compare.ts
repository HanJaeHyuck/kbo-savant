import apiClient from './client'

export const getCompare = async (ids: string, season: number) => {
  const { data } = await apiClient.get('/api/compare', { params: { ids, season } })
  return data
}
