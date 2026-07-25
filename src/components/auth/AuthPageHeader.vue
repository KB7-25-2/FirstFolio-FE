<script setup>
defineProps({
  tagline: {
    type: String,
    default: '나의 첫 번째 자산 관리 여정',
  },
})
</script>

<template>
  <header class="flex flex-col items-center text-center">
    <h1 class="font-serif text-[34px] leading-none font-bold text-[var(--auth-title)]">
      Firstfolio
    </h1>
    <p class="mt-2 text-[12px] text-[var(--auth-subtitle)]">{{ tagline }}</p>
  </header>
</template>
