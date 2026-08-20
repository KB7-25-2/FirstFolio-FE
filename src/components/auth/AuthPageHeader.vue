<script setup>
import { BRAND_WORDMARK_SRC } from '@/constants/brandAssets.js'

defineProps({
  tagline: {
    type: String,
    default: '나의 첫 번째 자산 관리 여정',
  },
})
</script>

<template>
  <header class="flex flex-col items-center text-center">
    <h1>
      <img
        :src="BRAND_WORDMARK_SRC"
        alt="firstfolio"
        class="h-auto w-[min(52vw,200px)]"
        width="200"
        height="50"
        draggable="false"
      />
    </h1>
    <p class="mt-2 text-[12px] text-[var(--auth-subtitle)]">{{ tagline }}</p>
  </header>
</template>
