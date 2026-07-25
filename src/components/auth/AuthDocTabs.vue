<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
    validator: (value) => ['login', 'signup'].includes(value),
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex items-start gap-6 text-[13px]">
    <button
      type="button"
      class="font-serif leading-normal whitespace-nowrap"
      :class="
        modelValue === 'login'
          ? 'font-bold text-[var(--auth-tab)] underline decoration-solid underline-offset-4'
          : 'font-normal text-[var(--auth-tab-muted)]'
      "
      @click="$emit('update:modelValue', 'login')"
    >
      로그인
    </button>
    <button
      type="button"
      class="font-serif leading-normal whitespace-nowrap"
      :class="
        modelValue === 'signup'
          ? 'font-bold text-[var(--auth-tab)] underline decoration-solid underline-offset-4'
          : 'font-normal text-[var(--auth-tab-muted)]'
      "
      @click="$emit('update:modelValue', 'signup')"
    >
      회원가입
    </button>
  </div>
</template>
