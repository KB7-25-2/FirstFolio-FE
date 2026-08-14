import axios from 'axios'
import { setupRequestInterceptor, setupResponseInterceptor } from '@/api/user/interceptors.js'

/**
 * 관리자 API 전용 클라이언트
 * — 유저앱 `apiClient`와 인스턴스를 분리해 baseURL·timeout·인터셉터를 독립 확장한다.
 */
const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api',
  timeout:
    Number(import.meta.env.VITE_ADMIN_API_TIMEOUT || import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

setupRequestInterceptor(adminApiClient)
setupResponseInterceptor(adminApiClient)

export default adminApiClient
