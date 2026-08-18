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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-5"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-[var(--mobile-width)] rounded-2xl border-[0.5px] border-[rgba(245,237,217,0.12)] bg-[#161b22] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-serif text-[17px] font-bold text-[#f5edd9]">{{ title }}</h2>
        <button
          type="button"
          class="text-[rgba(245,237,217,0.5)]"
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
