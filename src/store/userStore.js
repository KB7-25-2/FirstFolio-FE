import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUserProfile } from '@/services/userService.js'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const nickname = computed(() => profile.value?.nickname ?? '')
  const email = computed(() => profile.value?.email ?? '')
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

  const clearProfile = () => {
    profile.value = null
    error.value = null
  }

  return {
    profile,
    isLoading,
    error,
    nickname,
    email,
    pointBalance,
    pointBalanceDisplay,
    greeting,
    fetchProfile,
    clearProfile,
  }
})
