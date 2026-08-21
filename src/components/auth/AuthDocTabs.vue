<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
    validator: (value) => ['login', 'signup'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div
    class="inline-flex rounded-[10px] border-[0.5px] border-[rgba(90,56,32,0.35)] bg-[rgba(44,24,16,0.08)] p-[3px] shadow-[inset_0_1px_2px_rgba(44,24,16,0.08)]"
    role="tablist"
    aria-label="인증 방식"
    :aria-disabled="disabled"
  >
    <button
      type="button"
      role="tab"
      :aria-selected="modelValue === 'login'"
      :disabled="disabled"
      class="min-w-[88px] rounded-[8px] px-4 py-2 font-serif text-[13px] leading-none whitespace-nowrap transition-[background-color,color,box-shadow,font-weight] duration-150 disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        modelValue === 'login'
          ? 'bg-[rgba(255,248,236,0.92)] font-bold text-[var(--auth-tab)] shadow-[0_1px_3px_rgba(44,24,16,0.18)]'
          : 'font-semibold text-[rgba(44,24,16,0.62)] hover:bg-[rgba(255,248,236,0.35)] hover:text-[var(--auth-tab)]'
      "
      @click="$emit('update:modelValue', 'login')"
    >
      로그인
    </button>
    <button
      type="button"
      role="tab"
      :aria-selected="modelValue === 'signup'"
      :disabled="disabled"
      class="min-w-[88px] rounded-[8px] px-4 py-2 font-serif text-[13px] leading-none whitespace-nowrap transition-[background-color,color,box-shadow,font-weight] duration-150 disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        modelValue === 'signup'
          ? 'bg-[rgba(255,248,236,0.92)] font-bold text-[var(--auth-tab)] shadow-[0_1px_3px_rgba(44,24,16,0.18)]'
          : 'font-semibold text-[rgba(44,24,16,0.62)] hover:bg-[rgba(255,248,236,0.35)] hover:text-[var(--auth-tab)]'
      "
      @click="$emit('update:modelValue', 'signup')"
    >
      회원가입
    </button>
  </div>
</template>
