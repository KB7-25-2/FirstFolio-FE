<script setup>
defineProps({
  term: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="border border-[rgba(139,100,60,0.18)] bg-[#fff7eb] px-3 py-2.5">
    <p class="font-serif text-[11px] font-black text-[#c17f24]">{{ term }}</p>
    <p class="mt-1 font-serif text-[11px] leading-4 whitespace-pre-line text-[rgba(41,33,26,0.85)]">
      {{ body }}
    </p>
  </div>
</template>
