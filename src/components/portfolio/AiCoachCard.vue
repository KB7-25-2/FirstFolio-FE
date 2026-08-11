<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section
    class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
  >
    <p class="font-serif text-[12px] font-bold text-[#c17f24]">AI 피드백</p>
    <p class="mt-2 font-serif text-[13px] leading-relaxed text-[rgba(41,33,26,0.75)]">
      {{ message }}
    </p>
  </section>
</template>
