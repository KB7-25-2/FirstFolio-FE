<script setup>
import { computed } from 'vue'
import { formatKoreanDate } from '@/utils/date.js'
import DailyQuestNote from '@/components/DailyQuestNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'

const todayLabel = computed(() => formatKoreanDate())
</script>

<template>
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <header class="chalk-header shrink-0 px-5">
      <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
        {{ todayLabel }}
      </p>
      <h1
        class="chalk-header__title mt-1 font-pen text-[28px] leading-none font-normal text-[var(--chalk-text)]"
      >
        데일리
      </h1>
      <p class="mt-1 font-serif text-[11px] leading-tight text-[var(--chalk-text-faint)]">
        오늘의 퀘스트와 금융 뉴스
      </p>
    </header>

    <div class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4">
      <div class="flex justify-center">
        <DailyQuestNote />
      </div>

      <NewsScrap />
    </div>
  </div>
</template>
