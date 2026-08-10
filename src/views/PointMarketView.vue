<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGifticonStore } from '@/store/gifticonStore.js'
import { useUserStore } from '@/store/userStore.js'
import PointBalanceCard from '@/components/pointMarket/PointBalanceCard.vue'
import GifticonGridItem from '@/components/pointMarket/GifticonGridItem.vue'
import SelectedGifticonBar from '@/components/pointMarket/SelectedGifticonBar.vue'
import RedemptionHistoryItem from '@/components/pointMarket/RedemptionHistoryItem.vue'

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
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <header class="chalk-header shrink-0 px-5">
      <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
        FIRSTFOLIO REWARDS
      </p>
      <h1
        class="chalk-header__title mt-1 font-pen text-[26px] leading-none font-normal text-[var(--chalk-text)]"
      >
        {{ currentView === 'catalog' ? '포인트 스토어' : '교환 내역' }}
      </h1>
    </header>

    <div class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-5">
      <div class="flex items-center justify-between">
        <p class="font-serif text-xs text-[rgba(41,33,26,0.55)]">
          {{
            currentView === 'catalog'
              ? '모은 포인트를 작은 혜택으로 바꿔요'
              : '신청한 기프티콘의 처리 상태를 확인해요'
          }}
        </p>
        <button
          type="button"
          class="shrink-0 rounded-full border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[#fff8ec] px-3 py-1.5 font-serif text-xs font-bold text-[#c17f24]"
          @click="currentView = currentView === 'catalog' ? 'history' : 'catalog'"
        >
          {{ currentView === 'catalog' ? '교환 내역 ›' : '‹ 스토어로' }}
        </button>
      </div>

      <PointBalanceCard :point-balance="userStore.pointBalance" />

      <template v-if="currentView === 'catalog'">
        <div>
          <div class="flex items-center justify-between">
            <p class="font-serif font-bold text-[#2c1810]">기프티콘</p>
            <p class="font-serif text-xs text-[rgba(41,33,26,0.45)]">
              {{ filteredGifticons.length }}개 상품
            </p>
          </div>

          <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="filter in FILTERS"
              :key="filter.value"
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 font-serif text-xs font-bold transition-colors"
              :class="
                activeFilter === filter.value
                  ? 'bg-[#c17f24] text-[#fff8ec]'
                  : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(44,24,16,0.55)]'
              "
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <p v-if="gifticonStore.error" class="mt-3 font-serif text-sm text-[#c0433f]">
            {{ gifticonStore.error }}
          </p>

          <div v-if="filteredGifticons.length" class="mt-3 grid grid-cols-2 gap-3">
            <GifticonGridItem
              v-for="gifticon in filteredGifticons"
              :key="gifticon.gifticonId"
              :gifticon="gifticon"
              :is-selected="gifticon.gifticonId === selectedGifticonId"
              @select="selectGifticon"
            />
          </div>
          <p
            v-else-if="gifticonStore.isLoading"
            class="mt-3 font-serif text-sm text-[rgba(41,33,26,0.45)]"
          >
            불러오는 중…
          </p>
          <p v-else class="mt-3 font-serif text-sm text-[rgba(41,33,26,0.45)]">
            해당 카테고리 상품이 없어요.
          </p>
        </div>

        <!-- 하단 고정 바 자리 확보 (선택된 상품이 있을 때) -->
        <div v-if="selectedGifticon" class="h-20" aria-hidden="true" />

        <p v-if="redeemError && !selectedGifticon" class="font-serif text-sm text-[#c0433f]">
          {{ redeemError }}
        </p>

        <Teleport to="body">
          <div v-if="selectedGifticon" class="fixed inset-x-0 bottom-[64px] z-40 px-5">
            <div class="mx-auto max-w-[var(--mobile-width)]">
              <p v-if="redeemError" class="mb-2 font-serif text-xs text-[#c0433f]">
                {{ redeemError }}
              </p>
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
        <ul v-if="gifticonStore.redemptionHistory.length" class="flex flex-col gap-2">
          <RedemptionHistoryItem
            v-for="order in gifticonStore.redemptionHistory"
            :key="order.gifticonOrderId"
            :order="order"
          />
        </ul>
        <p
          v-else-if="gifticonStore.isLoading"
          class="font-serif text-sm text-[rgba(41,33,26,0.45)]"
        >
          불러오는 중…
        </p>
        <p v-else class="font-serif text-sm text-[rgba(41,33,26,0.45)]">아직 교환 내역이 없어요.</p>
      </template>
    </div>
  </div>
</template>
