import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserProfile } from '@/api/userApi.js'

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchProfile = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getUserProfile()
      profile.value = data
    } catch (err) {
      error.value = err.message
      throw err
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
    fetchProfile,
    clearProfile,
  }
})
