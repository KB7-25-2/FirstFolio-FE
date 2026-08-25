<script setup>
import { BRAND_WORDMARK_SRC } from '@/constants/brandAssets.js'

defineProps({
  tagline: {
    type: String,
    default: '배우며 완성하는 나의 첫 자산 포트폴리오',
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
