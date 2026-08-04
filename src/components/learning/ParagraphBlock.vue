<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div
    class="border border-[rgba(139,100,60,0.2)] bg-[#fff7eb] px-3 py-3 font-serif text-[11px] leading-4 whitespace-pre-line text-[rgba(41,33,26,0.85)]"
  >
    {{ text }}
  </div>
</template>
