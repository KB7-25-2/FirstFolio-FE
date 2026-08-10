<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGifticonStore } from '@/store/gifticonStore.js'
import { useUserStore } from '@/store/userStore.js'
import PointBalanceCard from '@/components/pointMarket/PointBalanceCard.vue'
import GifticonGridItem from '@/components/pointMarket/GifticonGridItem.vue'
import SelectedGifticonBar from '@/components/pointMarket/SelectedGifticonBar.vue'
import RedemptionHistoryItem from '@/components/pointMarket/RedemptionHistoryItem.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import portfolioBg from '@/assets/portfolio/portfolio-bg.png'

const gifticonStore = useGifticonStore()
const userStore = useUserStore()

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'CAFE', label: '카페' },
  { value: 'DELIVERY', label: '배달' },
  { value: 'CONVENIENCE', label: '편의점' },
]

// 별도 라우트 없이, 이 화면 안에서 카탈로그/교환내역 두 뷰를 토글한다.
const currentView = ref('catalog') // 'catalog' | 'history'
const activeFilter = ref('ALL')
const selectedGifticonId = ref(null)
const isRedeeming = ref(false)
const redeemError = ref(null)

onMounted(() => {
  gifticonStore.fetchGifticons()
  if (!userStore.profile) userStore.fetchProfile()
})

watch(currentView, (view) => {
  if (view === 'history' && !gifticonStore.redemptionHistory.length) {
    gifticonStore.fetchRedemptionHistory()
  }
})

const filteredGifticons = computed(() => {
  if (activeFilter.value === 'ALL') return gifticonStore.gifticons
  return gifticonStore.gifticons.filter((item) => item.category === activeFilter.value)
})

const selectedGifticon = computed(() =>
  gifticonStore.gifticons.find((item) => item.gifticonId === selectedGifticonId.value),
)

const selectGifticon = (gifticon) => {
  if (!gifticon.isRedeemable) return
  redeemError.value = null
  selectedGifticonId.value =
    selectedGifticonId.value === gifticon.gifticonId ? null : gifticon.gifticonId
}

const handleRedeem = async () => {
  if (!selectedGifticon.value) return
  isRedeeming.value = true
  redeemError.value = null

  try {
    await gifticonStore.redeem(selectedGifticon.value)
    selectedGifticonId.value = null
    // 방금 신청한 게 내역에 바로 보이도록 다시 불러온다.
    gifticonStore.fetchRedemptionHistory()
  } catch (err) {
    redeemError.value = err.message || '교환 처리 중 문제가 발생했어요.'
  } finally {
    isRedeeming.value = false
  }
}
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col gap-4 overflow-hidden px-5 pt-6">
    <img
      :src="portfolioBg"
      alt=""
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[var(--pf-page-bg)]/75" />
    <header class="shrink-0">
      <p class="text-[10px] font-bold tracking-wide text-[#f5a647]">FIRSTFOLIO REWARDS</p>
      <div class="mt-1 flex items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-white">
            {{ currentView === 'catalog' ? '포인트 스토어' : '교환 내역' }}
          </h1>
          <p class="mt-1 text-xs text-[#9aa1b0]">
            {{
              currentView === 'catalog'
                ? '모은 포인트를 직은 혜택으로 바꿔요'
                : '신청한 기프티콘의 처리 상태를 확인해요'
            }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white"
          @click="currentView = currentView === 'catalog' ? 'history' : 'catalog'"
        >
          {{ currentView === 'catalog' ? '교환 내역 ›' : '‹ 스토어로' }}
        </button>
      </div>
    </header>

    <PointBalanceCard class="shrink-0" :point-balance="userStore.pointBalance" />

    <template v-if="currentView === 'catalog'">
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="shrink-0">
          <div class="flex items-center justify-between">
            <p class="font-bold text-white">기프티콘</p>
            <p class="text-xs text-[#9aa1b0]">{{ filteredGifticons.length }}개 상품</p>
          </div>

          <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="filter in FILTERS"
              :key="filter.value"
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
              :class="
                activeFilter === filter.value
                  ? 'bg-[#f5a647] text-[#1f1a14]'
                  : 'border border-white/15 text-[#9aa1b0]'
              "
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <p v-if="gifticonStore.error" class="mt-3 text-sm text-[#ff8f8a]">
            {{ gifticonStore.error }}
          </p>
        </div>

        <div class="nav-scroll-pad mt-3 min-h-0 flex-1 overflow-y-scroll overscroll-contain px-2">
          <div v-if="filteredGifticons.length" class="grid grid-cols-2 gap-3">
            <GifticonGridItem
              v-for="gifticon in filteredGifticons"
              :key="gifticon.gifticonId"
              :gifticon="gifticon"
              :is-selected="gifticon.gifticonId === selectedGifticonId"
              @select="selectGifticon"
            />
          </div>
          <BaseLoading v-else-if="gifticonStore.isLoading" />
          <p v-else class="text-sm text-[#9aa1b0]">해당 카테고리 상품이 없어요.</p>
        </div>
      </div>

      <!-- 하단 고정 바 자리 확보 (선택된 상품이 있을 때) -->
      <div v-if="selectedGifticon" class="h-20 shrink-0" aria-hidden="true" />

      <p v-if="redeemError && !selectedGifticon" class="shrink-0 text-sm text-[#ff8f8a]">
        {{ redeemError }}
      </p>

      <Teleport to="body">
        <div v-if="selectedGifticon" class="fixed inset-x-0 bottom-[64px] z-40 px-5">
          <div class="mx-auto max-w-[var(--mobile-width)]">
            <p v-if="redeemError" class="mb-2 text-xs text-[#ff8f8a]">{{ redeemError }}</p>
            <SelectedGifticonBar
              :gifticon="selectedGifticon"
              :point-balance="userStore.pointBalance"
              :is-submitting="isRedeeming"
              @redeem="handleRedeem"
            />
          </div>
        </div>
      </Teleport>
    </template>

    <template v-else>
      <div class="nav-scroll-pad min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul v-if="gifticonStore.redemptionHistory.length" class="flex flex-col gap-2">
          <RedemptionHistoryItem
            v-for="order in gifticonStore.redemptionHistory"
            :key="order.gifticonOrderId"
            :order="order"
          />
        </ul>
        <BaseLoading v-else-if="gifticonStore.isLoading" />
        <p v-else class="text-sm text-[#9aa1b0]">아직 교환 내역이 없어요.</p>
      </div>
    </template>
  </div>
</template>
