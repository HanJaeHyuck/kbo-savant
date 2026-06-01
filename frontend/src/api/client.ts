import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerError'
  }
}

const apiClient = axios.create({ baseURL: BASE_URL })

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 404) throw new NotFoundError(error.response.data?.detail?.detail ?? '선수를 찾을 수 없습니다.')
    if (status === 422) throw new ValidationError(error.response.data?.detail?.detail ?? '잘못된 요청입니다.')
    throw new ServerError('데이터를 불러오는 중 오류가 발생했습니다.')
  }
)

export default apiClient
