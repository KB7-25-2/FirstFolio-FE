import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as gifticonService from '@/services/gifticonService.js'
import { useUserStore } from '@/store/userStore.js'

export const useGifticonStore = defineStore('gifticon', () => {
  const gifticons = ref([])
  const nextCursor = ref(null)
  const redemptionHistory = ref([])
  const lastRedemption = ref(null)

  const isLoading = ref(false)
  const error = ref(null)

  const fetchGifticons = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { items, nextCursor: cursor } = await gifticonService.getGifticonList(params)
      gifticons.value = items
      nextCursor.value = cursor
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // gifticon 교환. 포인트 잔액의 진짜 소스는 userStore뿐이라, 성공 후 다시 동기화한다.
  const redeem = async (gifticon) => {
    const userStore = useUserStore()

    const result = await gifticonService.redeemGifticonService({
      gifticon,
      currentPointBalance: userStore.pointBalance,
    })
    lastRedemption.value = result
    await userStore.fetchProfile()
    return result
  }

  const fetchRedemptionHistory = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { items } = await gifticonService.getRedemptionHistoryList(params)
      redemptionHistory.value = items
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 교환내역 리스트를 탭했을 때 호출한다. 목록엔 없는 spent_points/provider_reference 등을 준다.
  const fetchOrderDetail = (gifticonOrderId) =>
    gifticonService.getGifticonOrderDetailService(gifticonOrderId)

  return {
    gifticons,
    nextCursor,
    redemptionHistory,
    lastRedemption,
    isLoading,
    error,
    fetchGifticons,
    redeem,
    fetchRedemptionHistory,
    fetchOrderDetail,
  }
})
