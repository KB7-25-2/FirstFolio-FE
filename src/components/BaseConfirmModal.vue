<script setup>
defineProps({
  title: {
    type: String,
    default: '확인',
  },
  message: {
    type: String,
    required: true,
  },
  confirmLabel: {
    type: String,
    default: '확인',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
  confirmVariant: {
    type: String,
    default: 'default', // 'default' | 'danger'
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-5"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @click.self="!isSubmitting && $emit('close')"
  >
    <div
      class="w-full max-w-[var(--mobile-width)] rounded-2xl border-[0.5px] border-[rgba(245,237,217,0.12)] bg-[#161b22] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
    >
      <h2 class="font-serif text-[17px] font-bold text-[#f5edd9]">{{ title }}</h2>
      <p class="mt-3 font-serif text-[13px] leading-relaxed text-[rgba(245,237,217,0.72)]">
        {{ message }}
      </p>

      <div class="mt-6 flex gap-2">
        <button
          type="button"
          class="btn-hover flex-1 rounded-xl border-[0.5px] border-[rgba(245,237,217,0.18)] py-2.5 font-serif text-[13px] text-[rgba(245,237,217,0.85)] disabled:opacity-40"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="btn-hover flex-1 rounded-xl py-2.5 font-serif text-[13px] font-bold disabled:opacity-40"
          :class="
            confirmVariant === 'danger'
              ? 'border-[0.5px] border-[rgba(220,80,80,0.45)] bg-[rgba(220,80,80,0.18)] text-[#f0b4b4]'
              : 'bg-[rgba(193,127,36,0.92)] text-[#1a1208]'
          "
          :disabled="isSubmitting"
          @click="$emit('confirm')"
        >
          {{ isSubmitting ? '처리 중…' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
