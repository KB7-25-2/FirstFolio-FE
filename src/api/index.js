import axios from 'axios'
import { setupRequestInterceptor, setupResponseInterceptor } from '@/api/user/interceptors.js'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

setupRequestInterceptor(apiClient)
setupResponseInterceptor(apiClient)

export default apiClient
