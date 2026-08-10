<script setup>
defineProps({
  assets: { type: String, default: '' },
  risk: { type: String, default: '' },
  goal: { type: String, default: '' },
})
</script>

<template>
  <div
    class="w-[148px] overflow-hidden rounded-[14px] border-[0.5px] border-[rgba(255,255,255,0.3)] bg-[rgba(20,26,41,0.68)] px-2.5 py-2 backdrop-blur-[10px]"
  >
    <p class="font-pen text-[11px] text-[#f5c76b]">고객 요구사항</p>
    <div
      class="mt-1.5 flex min-h-[18px] items-center justify-between overflow-hidden rounded-md bg-[rgba(255,255,255,0.12)] px-2 text-[10px]"
    >
      <span class="text-[#bfb8a8]">자산</span>
      <span class="font-bold text-[#f5c76b]">{{ assets }}</span>
    </div>
    <div
      class="mt-1 flex min-h-[18px] items-center justify-between overflow-hidden rounded-md bg-[rgba(255,255,255,0.12)] px-2 text-[10px]"
    >
      <span class="text-[#bfb8a8]">리스크</span>
      <span class="font-bold text-[#f5edd9]">{{ risk }}</span>
    </div>
    <div
      class="mt-1 flex min-h-[18px] items-center justify-between overflow-hidden rounded-md border-[0.5px] border-[rgba(245,199,107,0.35)] bg-[rgba(245,199,107,0.15)] px-2 text-[10px]"
    >
      <span class="font-pen text-[#f5c76b]">목표</span>
      <span class="font-bold text-[#f5edd9]">{{ goal }}</span>
    </div>
  </div>
</template>
