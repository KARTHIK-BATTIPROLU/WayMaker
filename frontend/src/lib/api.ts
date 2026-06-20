import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
  timeout: 30000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/refresh`,
            {},
            { withCredentials: true }
          )
          useAuthStore.getState().setAccessToken(data.access_token)
          refreshSubscribers.forEach((cb) => cb(data.access_token))
          refreshSubscribers = []
          isRefreshing = false
        } catch {
          useAuthStore.getState().clearAuth()
          isRefreshing = false
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }
    return Promise.reject(error)
  }
)

export default api
