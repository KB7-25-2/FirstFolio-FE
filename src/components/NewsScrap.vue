<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNewsStore } from '@/store/newsStore.js'
import NewsClipping from '@/components/NewsClipping.vue'
import NewsDetailModal from '@/components/NewsDetailModal.vue'
import BaseLoading from '@/components/BaseLoading.vue'

const newsStore = useNewsStore()
const { items, isLoading, error } = storeToRefs(newsStore)

onMounted(() => {
  newsStore.fetchNews({ limit: 3 })
})

const collectedLabel = computed(() => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}. ${mm}. ${dd} 수집`
})

const pinSide = (index) => (index % 2 === 0 ? 'left' : 'right')

const onSelect = (id) => {
  newsStore.selectNews(id)
}
</script>

<template>
  <section class="relative w-full" aria-label="오늘의 금융 뉴스 스크랩">
    <div
      class="scrap-board pointer-events-none absolute inset-0 rounded-[2px]"
      aria-hidden="true"
    />

    <div class="relative z-[1] px-3.5 pt-3.5 pb-4">
      <div class="mb-3 flex items-end justify-between gap-2">
        <h2 class="scrap-board__title font-pen text-[22px] leading-none font-normal">
          오늘의 금융 뉴스 스크랩
        </h2>
        <span class="shrink-0 font-serif text-[10px] text-[var(--cork-ink-muted)]">
          {{ collectedLabel }}
        </span>
      </div>

      <BaseLoading
        v-if="isLoading"
        class="py-8 text-center"
        size="xs"
        message="뉴스를 불러오는 중…"
      />

      <div v-else-if="error" class="py-8 text-center font-serif text-xs text-[var(--study-total)]">
        {{ error }}
      </div>

      <div v-else class="flex flex-col items-center gap-3">
        <NewsClipping
          v-for="(item, index) in items"
          :key="item.financial_news_id"
          :item="item"
          :pin-side="pinSide(index)"
          @select="onSelect"
        />
      </div>
    </div>

    <NewsDetailModal />
  </section>
</template>
