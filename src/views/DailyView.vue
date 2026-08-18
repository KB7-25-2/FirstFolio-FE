<script setup>
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
      class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-5"
    >
      <div class="shrink-0">
        <p class="font-serif text-[10px] tracking-wide text-[var(--cork-ink-faint)]">
          {{ todayLabel }}
        </p>
        <p class="mt-0.5 font-serif text-[12px] text-[var(--cork-ink-muted)]">
          오늘의 퀘스트와 금융 뉴스
        </p>
      </div>

      <ScrollReveal class="flex justify-center">
        <DailyQuestNote />
      </ScrollReveal>

      <ScrollReveal>
        <NewsScrap />
      </ScrollReveal>
    </div>
  </div>
</template>
