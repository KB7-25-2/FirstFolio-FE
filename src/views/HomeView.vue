<script setup>
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import NewsScrap from '@/components/NewsScrap.vue'
</script>

<template>
  <div class="min-h-full bg-[#0d1117] px-5 pt-6 pb-8">
    <div class="flex justify-center">
      <PortfolioSummary />
    </div>

    <h2 class="mt-8 mb-4 font-serif text-[12px] font-bold text-[rgba(245,237,217,0.9)]">
      현재 학습 현황
    </h2>
    <div class="flex justify-center pt-3">
      <StudyNote />
    </div>

    <div class="mt-8">
      <NewsScrap />
    </div>
  </div>
</template>
