<script setup>
defineProps({
  label: {
    type: String,
    default: '더 알아보기',
  },
  subtitle: {
    type: String,
    default: '',
  },
})

defineEmits(['open'])
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <button
      type="button"
      class="btn-hover flex items-start gap-1.5 rounded-[20px] border-[0.5px] border-[#c17f24] bg-white px-3.5 py-2.5 text-[#1f2e59] shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
      @click="$emit('open')"
    >
      <span class="text-[13px]" aria-hidden="true">💡</span>
      <span class="text-[12px] font-bold">{{ label }}</span>
    </button>
    <p v-if="subtitle" class="text-right text-[10px] text-[#8c8f9e]">{{ subtitle }}</p>
  </div>
</template>
