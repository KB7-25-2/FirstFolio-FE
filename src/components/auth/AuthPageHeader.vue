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
    <div class="flex items-center justify-center gap-2">
      <img src="../../assets/auth/brand-logo.png" alt="Firstfolio Logo" class="w-15 h-15" />
      <h1 class="font-serif text-[34px] leading-none font-bold text-[var(--auth-title)]">
        Firstfolio
      </h1>
    </div>
    <p class="mt-2 text-[12px] text-[var(--auth-subtitle)]">{{ tagline }}</p>
  </header>
</template>
