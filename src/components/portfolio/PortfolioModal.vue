<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  // 'dark'(기본, 기존 모달들 — 매도·구매·파산 신청 등)은 그대로 두고,
  // 밝은 종이 톤 화면(거래 내역 등)에 어울리는 'light' 배리언트를 추가.
  variant: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'light'].includes(value),
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
      class="w-full max-w-[var(--mobile-width)] rounded-2xl border-[0.5px] p-5"
      :class="
        variant === 'light'
          ? 'border-[rgba(193,127,36,0.3)] bg-[#fff8ec] shadow-[0_16px_40px_rgba(44,24,16,0.25)]'
          : 'border-[rgba(245,237,217,0.12)] bg-[#161b22] shadow-[0_16px_40px_rgba(0,0,0,0.45)]'
      "
    >
      <div class="flex items-center justify-between">
        <h2
          class="font-serif text-[17px] font-bold"
          :class="variant === 'light' ? 'text-[#2c1810]' : 'text-[#f5edd9]'"
        >
          {{ title }}
        </h2>
        <button
          type="button"
          class="rounded-full px-1.5 py-0.5 transition-colors"
          :class="
            variant === 'light'
              ? 'text-[rgba(41,33,26,0.5)] hover:bg-[rgba(193,127,36,0.12)] hover:text-[#2c1810]'
              : 'text-[rgba(245,237,217,0.5)] hover:bg-[rgba(245,237,217,0.08)] hover:text-[#f5edd9]'
          "
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
