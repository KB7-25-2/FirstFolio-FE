<script setup>
defineProps({
  documentTitle: {
    type: String,
    default: '공 문 서',
  },
  greeting: {
    type: String,
    default: '',
  },
  mission: {
    type: String,
    default: '',
  },
  startLabel: {
    type: String,
    default: '게임 시작 →',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['start'])
</script>

<template>
  <div class="px-5 py-8 text-center">
    <p class="font-serif text-lg font-bold tracking-[0.2em] text-[#2c1810]">
      {{ documentTitle }}
    </p>
    <p v-if="greeting" class="mt-5 font-serif text-[13px] leading-relaxed text-[rgba(61,31,8,0.8)]">
      {{ greeting }}
    </p>
    <p
      v-if="mission"
      class="mt-4 font-serif text-[13px] leading-[22px] whitespace-pre-line text-[rgba(61,31,8,0.75)]"
    >
      {{ mission }}
    </p>
    <button
      type="button"
      class="mt-8 flex h-12 w-full items-center justify-center rounded bg-[#c17f24] font-serif text-[15px] font-bold text-[#f5edd9] disabled:opacity-60"
      :disabled="disabled"
      @click="$emit('start')"
    >
      {{ startLabel }}
    </button>
  </div>
</template>
