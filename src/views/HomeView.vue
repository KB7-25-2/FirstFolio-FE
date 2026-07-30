<script setup>
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'
</script>

<template>
  <div class="flex min-h-full flex-col gap-5 bg-[#0d1117] px-5 pt-6 pb-8">
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
