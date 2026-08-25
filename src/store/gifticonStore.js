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
      const {
        items,
        nextCursor: cursor,
        pointBalance,
      } = await gifticonService.getGifticonList(params)
      gifticons.value = items
      nextCursor.value = cursor
      // 목록의 can_exchange와 화면 잔액이 어긋나지 않게 서버 잔액으로 맞춤
      if (pointBalance != null) {
        useUserStore().patchPointBalance(pointBalance)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 잔액 기준으로 목록의 교환 가능 여부만 다시 계산한다.
   * (교환 직후 서버 목록 재조회 전에도 '포인트 부족'이 바로 보이게)
   * @param {number} balance
   */
  const applyRedeemabilityFromBalance = (balance) => {
    const points = Number(balance)
    if (Number.isNaN(points)) return

    gifticons.value = gifticons.value.map((item) => {
      if (item.stockStatus === 'SOLD_OUT') {
        return { ...item, isRedeemable: false, statusLabel: '품절' }
      }
      const canExchange = points >= Number(item.pricePoints)
      return {
        ...item,
        isRedeemable: canExchange,
        statusLabel: canExchange ? '구매 가능' : '포인트 부족',
      }
    })
  }

  // gifticon 교환. 성공 후 잔액·can_exchange(목록 활성/비활성)를 함께 맞춘다.
  const redeem = async (gifticon) => {
    const userStore = useUserStore()

    try {
      const result = await gifticonService.redeemGifticonService({
        gifticon,
      })
      lastRedemption.value = result

      if (result?.pointBalance != null) {
        userStore.patchPointBalance(result.pointBalance)
        applyRedeemabilityFromBalance(result.pointBalance)
      } else {
        await userStore.syncPointBalance()
        applyRedeemabilityFromBalance(userStore.pointBalance)
      }

      // 재고·서버 can_exchange 최종 반영
      try {
        await fetchGifticons()
      } catch {
        // 잔액·로컬 비활성은 이미 반영됨 — 목록 재조회 실패는 교환 성공을 막지 않음
      }

      return result
    } catch (err) {
      if (err?.code === 'GIFTICON_PRICE_CHANGED' || err?.code === 'GIFTICON_SOLD_OUT') {
        try {
          await fetchGifticons()
        } catch {
          // 카탈로그 갱신 실패는 원래 교환 오류를 우선한다
        }
      }
      throw err
    }
  }

  const fetchRedemptionHistory = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      // 아래 image_url 조인에 카탈로그가 필요하다. 보통은 카탈로그 화면을 먼저 거쳐와서
      // 이미 채워져 있지만, 혹시 비어 있으면(예: 교환내역으로 바로 진입) 먼저 받아온다.
      if (!gifticons.value.length) {
        await fetchGifticons()
      }

      const { items } = await gifticonService.getRedemptionHistoryList(params)
      // 교환내역 목록 API(GET /gifticon-orders)엔 image_url이 없다(MyGifticonListItemResponse
      // 기준) — 상세 API를 아이템마다 호출하는 대신, 이미 불러온 상품 카탈로그(gifticons)와
      // gifticonId로 조인해서 채운다. 카탈로그에 없는 상품(판매종료 등)이면 imageUrl은 null로
      // 남고, 화면에서 기본 아이콘으로 대체한다.
      const imageUrlById = Object.fromEntries(
        gifticons.value.map((item) => [item.gifticonId, item.imageUrl]),
      )
      redemptionHistory.value = items.map((item) => ({
        ...item,
        imageUrl: imageUrlById[item.gifticonId] ?? null,
      }))
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

  const clear = () => {
    gifticons.value = []
    nextCursor.value = null
    redemptionHistory.value = []
    lastRedemption.value = null
    isLoading.value = false
    error.value = null
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
    clear,
  }
})
