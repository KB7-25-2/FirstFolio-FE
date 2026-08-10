<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section
    class="rounded-2xl border-[0.5px] border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
  >
    <p class="font-serif font-bold text-sm text-[var(--pf-highlight)]">💡 AI 피드백</p>
    <p class="mt-2 text-sm leading-relaxed text-[var(--pf-text)]">{{ message }}</p>
  </section>
</template>
