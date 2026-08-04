import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getPortfolioSummary,
  sellHolding as sellHoldingApi,
  purchaseProduct as purchaseProductApi,
  getPurchasableProducts,
  getTimeCompressionRules,
} from '@/api/portfolioApi.js'
import { mapPortfolioSummaryResponse, recomputePortfolioSummary } from '@/api/portfolioMapper.js'
import {
  mockPortfolioSummary,
  mockPurchasableProducts,
  mockTimeCompressionRules,
} from '@/mocks/portfolioMock.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const summary = ref(null)
  const purchasableProducts = ref([])
  const timeCompressionRules = ref([])

  const isLoading = ref(false)
  const error = ref(null)

  const fetchSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getPortfolioSummary()
      summary.value = mapPortfolioSummaryResponse(data)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 포트폴리오 API 호출 실패 — 목데이터로 대체합니다.', err)
        summary.value = mapPortfolioSummaryResponse(structuredClone(mockPortfolioSummary))
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchPurchasableProducts = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getPurchasableProducts()
      purchasableProducts.value = data
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 상품 목록 API 호출 실패 — 목데이터로 대체합니다.', err)
        purchasableProducts.value = structuredClone(mockPurchasableProducts)
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchTimeCompressionRules = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getTimeCompressionRules()
      timeCompressionRules.value = data
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 시간 압축 규칙 API 호출 실패 — 목데이터로 대체합니다.', err)
        timeCompressionRules.value = structuredClone(mockTimeCompressionRules)
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const sellHolding = async (holdingId, quantity) => {
    try {
      const { data } = await sellHoldingApi(holdingId, { quantity })
      summary.value = mapPortfolioSummaryResponse(data)
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        error.value = err.message
        throw err
      }
      console.warn('[portfolioStore] 판매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    const holding = summary.value.holdings.find((item) => item.holdingId === holdingId)
    if (!holding) return

    const soldQuantity = Math.min(quantity, holding.quantity)
    const soldAmount = soldQuantity * holding.unitPrice

    holding.quantity -= soldQuantity
    holding.principalAmount -= soldAmount
    summary.value.cashBalance += soldAmount

    if (holding.quantity <= 0) {
      summary.value.holdings = summary.value.holdings.filter((item) => item.holdingId !== holdingId)
    }

    summary.value = recomputePortfolioSummary(summary.value)
  }

  const buyProduct = async (product, quantity) => {
    try {
      const { data } = await purchaseProductApi(product.productId, { quantity })
      summary.value = mapPortfolioSummaryResponse(data)
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        error.value = err.message
        throw err
      }
      console.warn('[portfolioStore] 구매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    const cost = quantity * product.unitPrice
    if (cost > summary.value.cashBalance) {
      throw new Error('현금이 부족합니다.')
    }

    summary.value.cashBalance -= cost

    const existing = summary.value.holdings.find((item) => item.productId === product.productId)
    if (existing) {
      existing.quantity += quantity
      existing.principalAmount += cost
    } else {
      summary.value.holdings.push({
        holdingId: Date.now(),
        productId: product.productId,
        displayName: product.displayName,
        assetType: product.assetType,
        cycleSummary: product.cycleSummary,
        quantity,
        unitPrice: product.unitPrice,
        principalAmount: cost,
        highlighted: false,
      })
    }

    summary.value = recomputePortfolioSummary(summary.value)
  }

  return {
    summary,
    purchasableProducts,
    timeCompressionRules,
    isLoading,
    error,
    fetchSummary,
    fetchPurchasableProducts,
    fetchTimeCompressionRules,
    sellHolding,
    buyProduct,
  }
})
