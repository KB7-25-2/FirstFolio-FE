import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getUserProfile,
  updateUserProfile as updateUserProfileApi,
} from '@/services/userService.js'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)
  /** @type {Promise<import('@/types/user.js').UserProfile | null> | null} */
  let inflight = null

  const nickname = computed(() => profile.value?.nickname ?? '')
  const email = computed(() => profile.value?.email ?? '')
  const roleCode = computed(() => profile.value?.roleCode ?? '')
  const isAdmin = computed(() => roleCode.value === 'ADMIN')
  const newsletterOptIn = computed(() => profile.value?.newsletterOptIn ?? false)
  const pointBalance = computed(() => profile.value?.pointBalance ?? 0)
  const pointBalanceDisplay = computed(() => pointBalance.value.toLocaleString('ko-KR'))
  const greeting = computed(() =>
    nickname.value ? `안녕하세요, ${nickname.value} 님` : '안녕하세요',
  )

  /**
   * GET /users/me — 호출 시 항상 서버 잔액·프로필을 다시 맞춘다.
   * 동시 호출은 한 번의 요청으로 합친다.
   */
  const fetchProfile = async () => {
    if (inflight) return inflight

    isLoading.value = true
    error.value = null

    inflight = (async () => {
      try {
        const { data } = await getUserProfile()
        profile.value = data
        return data
      } catch (err) {
        error.value = err?.message || '프로필을 불러오지 못했습니다.'
        profile.value = null
        throw err
      } finally {
        isLoading.value = false
        inflight = null
      }
    })()

    return inflight
  }

  /**
   * 다른 API(기프티콘 목록 등)가 내려준 잔액으로 화면만 맞춘다.
   * @param {number | null | undefined} balance
   */
  const patchPointBalance = (balance) => {
    if (balance == null || Number.isNaN(Number(balance))) return
    if (!profile.value) return
    profile.value = {
      ...profile.value,
      pointBalance: Number(balance),
    }
  }

  /**
   * @param {{ nickname?: string, newsletterOptIn?: boolean }} payload
   */
  const updateProfile = async (payload) => {
    isSaving.value = true
    error.value = null

    try {
      const { data } = await updateUserProfileApi(payload)
      profile.value = data
      return data
    } catch (err) {
      error.value = err?.message || '프로필을 저장하지 못했습니다.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 서버에서 이미 적립·차감된 포인트를 GET /users/me 로 동기화한다.
   * (로컬 가산 목업은 쓰지 않는다 — 서버 잔액이 단일 소스)
   */
  const syncPointBalance = async () => {
    try {
      return await fetchProfile()
    } catch {
      return profile.value
    }
  }

  const clearProfile = () => {
    profile.value = null
    isLoading.value = false
    isSaving.value = false
    error.value = null
    inflight = null
  }

  return {
    profile,
    isLoading,
    isSaving,
    error,
    nickname,
    email,
    roleCode,
    isAdmin,
    newsletterOptIn,
    pointBalance,
    pointBalanceDisplay,
    greeting,
    fetchProfile,
    patchPointBalance,
    updateProfile,
    syncPointBalance,
    clearProfile,
  }
})
