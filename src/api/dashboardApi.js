import apiClient from '@/api/index.js'

/** GET /dashboard — 홈 통합 요약 (포트폴리오·일퀘·학습·이벤트·뉴스) */
export const getDashboard = () => apiClient.get('/dashboard')
