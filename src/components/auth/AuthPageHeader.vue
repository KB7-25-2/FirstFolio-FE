<script setup>
import brandIcon from '@/assets/auth/brand-icon.png'

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
      <img
        :src="brandIcon"
        alt=""
        class="h-15 w-15 shrink-0 object-contain"
        width="60"
        height="60"
        draggable="false"
      />
      <h1 class="font-serif text-[34px] leading-none font-bold text-[var(--auth-title)]">
        FirstFolio
      </h1>
    </div>
    <p class="mt-2 text-[12px] text-[var(--auth-subtitle)]">{{ tagline }}</p>
  </header>
</template>
