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
  <nav class="flex gap-1 rounded-full bg-[var(--pf-tab-bg)] p-1">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors"
      :class="
        isActive(tab.name)
          ? 'bg-[var(--pf-tab-active-bg)] text-[var(--pf-tab-active-text)]'
          : 'text-[var(--pf-tab-text)]'
      "
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
