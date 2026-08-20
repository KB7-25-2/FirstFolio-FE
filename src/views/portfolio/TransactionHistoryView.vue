<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import TransactionListItem from '@/components/portfolio/TransactionListItem.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'

const store = usePortfolioStore()

// value: undefined = 필터 없음(전체). GET /transactions의 type 쿼리와 1:1 대응.
const FILTERS = [
  { value: undefined, label: '전체' },
  { value: 'BUY', label: '매수' },
  { value: 'SELL', label: '매도' },
  { value: 'INTEREST', label: '이자' },
  { value: 'MATURITY', label: '만기' },
]

const activeFilter = ref(FILTERS[0])
const isLoadingMore = ref(false)

onMounted(() => {
  store.fetchTransactions({ type: activeFilter.value.value })
})

const selectFilter = (filter) => {
  if (filter.value === activeFilter.value.value) return
  activeFilter.value = filter
  store.fetchTransactions({ type: filter.value })
}

// next_cursor가 있는 동안만 "더 보기"를 보여준다(문서 기준: 다음 페이지 없으면 null).
const canLoadMore = computed(() => Boolean(store.transactionsNextCursor))

const loadMore = async () => {
  if (!canLoadMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    await store.fetchTransactions({
      type: activeFilter.value.value,
      cursor: store.transactionsNextCursor,
      append: true,
    })
  } finally {
    isLoadingMore.value = false
  }
}
</script>

<template>
  <div
    data-scroll-reveal-root
    class="nav-scroll-pad absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain"
  >
    <ScrollReveal>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="filter in FILTERS"
          :key="filter.label"
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 font-serif text-xs font-bold transition-colors"
          :class="
            activeFilter.value === filter.value
              ? 'bg-[#c17f24] text-[#fff8ec]'
              : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(44,24,16,0.55)]'
          "
          @click="selectFilter(filter)"
        >
          {{ filter.label }}
        </button>
      </div>
    </ScrollReveal>

    <p v-if="store.error" class="font-serif text-sm text-[#c0433f]">{{ store.error }}</p>

    <ScrollReveal v-if="store.transactions.length">
      <div
        class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
      >
        <ul class="flex flex-col gap-2.5">
          <TransactionListItem
            v-for="transaction in store.transactions"
            :key="transaction.transactionId"
            :transaction="transaction"
          />
        </ul>
      </div>
    </ScrollReveal>

    <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      불러오는 중…
    </p>
    <p v-else class="font-serif text-sm text-[rgba(41,33,26,0.45)]">해당 조건의 이력이 없어요.</p>

    <button
      v-if="canLoadMore"
      type="button"
      class="rounded-xl border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] py-2.5 font-serif text-xs font-bold text-[#c17f24] disabled:opacity-40"
      :disabled="isLoadingMore"
      @click="loadMore"
    >
      {{ isLoadingMore ? '불러오는 중…' : '더 보기' }}
    </button>
  </div>
</template>
