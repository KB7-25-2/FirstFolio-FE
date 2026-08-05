<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})

defineEmits(['close'])
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-[var(--mobile-width)] rounded-2xl border border-[var(--pf-card-border)] bg-[#1a1a2e] p-4"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-[var(--pf-text)]">{{ title }}</h2>
        <button
          type="button"
          class="text-[var(--pf-text-muted)]"
          aria-label="닫기"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="mt-3">
        <slot />
      </div>
    </div>
  </div>
</template>
