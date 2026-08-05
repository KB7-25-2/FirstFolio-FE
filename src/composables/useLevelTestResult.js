import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLevelTestStore } from '@/store/levelTestStore.js'

/** @type {Record<import('@/types/levelTest.js').AssetType, string>} */
export const LEVEL_TEST_ASSET_LABELS = {
  DEPOSIT_SAVINGS: '예·적금',
  BOND: '채권',
  STOCK: '주식',
  FUND: '펀드',
}

export const useLevelTestResult = () => {
  const levelTestStore = useLevelTestStore()
  const { chapterResultRows, recommendations, cartCandidates, isLoading } =
    storeToRefs(levelTestStore)

  const resultRows = computed(() =>
    chapterResultRows.value.map((row) => ({
      ...row,
      assetLabel: LEVEL_TEST_ASSET_LABELS[row.assetType] ?? row.assetType,
    })),
  )

  return {
    resultRows,
    recommendations,
    cartCandidates,
    isLoading,
  }
}
