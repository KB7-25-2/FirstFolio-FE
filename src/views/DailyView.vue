<script setup>
import { computed } from 'vue'
import { formatKoreanDate } from '@/utils/date.js'
import DailyQuestNote from '@/components/DailyQuestNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'

const todayLabel = computed(() => formatKoreanDate())
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#0d1117]">
    <header class="shrink-0 px-5 pt-6 pb-3">
      <p class="font-serif text-[10px] text-[rgba(245,237,217,0.55)]">
        {{ todayLabel }}
      </p>
      <h1 class="mt-1 font-serif text-[21px] font-black text-[#f5edd9]">데일리</h1>
      <p class="mt-1 font-serif text-[11px] text-[rgba(245,237,217,0.55)]">
        오늘의 퀘스트와 금융 뉴스
      </p>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 pb-8">
      <div class="flex justify-center">
        <DailyQuestNote />
      </div>

      <NewsScrap />
    </div>
  </div>
</template>
