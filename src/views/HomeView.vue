<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'
import { formatKoreanDate } from '@/utils/date.js'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'

const userStore = useUserStore()
const { greeting } = storeToRefs(userStore)

const todayLabel = computed(() => formatKoreanDate())

onMounted(() => {
  if (!userStore.profile) {
    userStore.fetchProfile()
  }
})
</script>

<template>
  <div class="flex min-h-full flex-col gap-5 bg-[#0d1117] px-5 pt-6 pb-8">
    <header class="relative pr-[100px]">
      <p class="font-serif text-[10px] text-[rgba(245,237,217,0.55)]">
        {{ todayLabel }}
      </p>
      <h1 class="mt-1 font-serif text-[21px] font-black text-[#f5edd9]">
        {{ greeting }}
      </h1>
      <div
        class="absolute top-5 right-0 flex rotate-5 items-center justify-center rounded border-[1.5px] border-[rgba(193,127,36,0.8)] px-2 py-[3px]"
        aria-hidden="true"
      >
        <span
          class="font-serif text-[10px] leading-none font-black whitespace-nowrap text-[rgba(193,127,36,0.9)]"
        >
          오늘 출석 완료
        </span>
      </div>
    </header>

    <div class="flex justify-center">
      <PortfolioSummary />
    </div>

    <div>
      <h2 class="mb-3 font-serif text-[12px] font-bold text-[rgba(245,237,217,0.9)]">
        현재 학습 현황
      </h2>
      <div class="flex justify-center pt-1">
        <StudyNote />
      </div>
    </div>

    <NewsScrap />
  </div>
</template>
