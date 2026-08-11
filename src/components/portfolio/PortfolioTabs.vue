<script setup>
import { useRoute } from 'vue-router'

const TABS = [
  { name: 'portfolio-holdings', label: '현재 자산' },
  { name: 'portfolio-purchase', label: '상품 구매' },
  { name: 'portfolio-time-compression', label: '시간 압축' },
]

const route = useRoute()
const isActive = (name) => route.name === name
</script>

<template>
  <nav
    class="flex gap-1.5 rounded-full border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-1.5 shadow-[0_4px_10px_rgba(44,24,16,0.08)]"
  >
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="flex-1 rounded-full py-2 text-center font-serif text-[11px] font-bold transition-colors"
      :class="isActive(tab.name) ? 'bg-[#c17f24] text-[#fff8ec]' : 'text-[rgba(44,24,16,0.55)]'"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
