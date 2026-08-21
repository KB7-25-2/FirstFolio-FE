<script setup>
defineOptions({ name: 'DailyView' })

import { computed } from 'vue'
import { formatKoreanDate } from '@/utils/date.js'
import DailyQuestNote from '@/components/DailyQuestNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'

const todayLabel = computed(() => formatKoreanDate())
</script>

<template>
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <div
      data-scroll-reveal-root
      class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4"
    >
      <header class="chalk-header shrink-0">
        <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
          {{ todayLabel }}
        </p>
        <h1
          class="chalk-header__title mt-1 truncate font-pen text-[26px] leading-none font-normal text-[var(--chalk-text)]"
        >
          데일리
        </h1>
        <p class="mt-1.5 font-serif text-xs text-[rgba(41,33,26,0.55)]">
          오늘의 퀘스트와 금융 뉴스
        </p>
      </header>

      <ScrollReveal class="flex justify-center">
        <DailyQuestNote />
      </ScrollReveal>

      <ScrollReveal>
        <NewsScrap />
      </ScrollReveal>
    </div>
  </div>
</template>
