<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'primary',
  },
})

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  outline: 'border-[0.5px] border-blue-600 text-blue-600 hover:bg-blue-50',
}

const buttonClass = computed(() => variantClasses[props.variant] ?? variantClasses.primary)
</script>

<template>
  <button
    type="button"
    class="btn-hover rounded-lg px-4 py-2 text-sm font-medium"
    :class="buttonClass"
  >
    {{ label }}
  </button>
</template>
