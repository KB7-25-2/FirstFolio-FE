import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getUserProfile,
  updateUserProfile as updateUserProfileApi,
  applyPointBalanceDelta,
} from '@/services/userService.js'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)

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

  const fetchProfile = async () => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const { data } = await getUserProfile()
      profile.value = data
    } catch (err) {
      error.value = err?.message || '프로필을 불러오지 못했습니다.'
      profile.value = null
    } finally {
      isLoading.value = false
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
   * 퀴즈 등 보상 포인트 가산 (목업)
   * @param {number} amount
   */
  const addPoints = async (amount) => {
    if (!amount || amount <= 0) return profile.value
    if (!profile.value) {
      await fetchProfile()
    }
    const { data } = await applyPointBalanceDelta(amount)
    profile.value = data
    return data
  }

  const clearProfile = () => {
    profile.value = null
    isLoading.value = false
    isSaving.value = false
    error.value = null
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
    updateProfile,
    addPoints,
    clearProfile,
  }
})
