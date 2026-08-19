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

  // 교환내역 리스트를 탭했을 때 호출한다. 목록엔 없는 category/first_disclosed_at 등을 준다.
  const fetchOrderDetail = (gifticonOrderId) =>
    gifticonService.getGifticonOrderDetailService(gifticonOrderId)

  // 실제 코드를 공개한다. 성공하면 목록/상세의 isDisclosed도 같이 갱신해서
  // 다시 조회하지 않아도 "코드 확인 완료" 상태가 바로 반영되게 한다.
  const discloseCode = async (gifticonOrderId) => {
    const disclosure = await gifticonService.discloseGifticonCodeService(gifticonOrderId)

    const historyItem = redemptionHistory.value.find(
      (item) => item.gifticonOrderId === gifticonOrderId,
    )
    if (historyItem) {
      historyItem.isDisclosed = true
      historyItem.status = disclosure.isExpired ? 'EXPIRED' : 'DISCLOSED'
      historyItem.statusLabel = disclosure.isExpired ? '기간 만료' : '코드 확인 완료'
    }

    return disclosure
  }

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
    discloseCode,
  }
})
