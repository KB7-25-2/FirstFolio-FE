<script setup>
import MemoPin from '@/components/MemoPin.vue'

defineProps({
  pointBalance: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <div class="relative w-full">
    <MemoPin side="right" tone="gold" />

    <section
      class="relative w-full rotate-[0.8deg] overflow-hidden rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.4)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[#c17f24]"
        aria-hidden="true"
      />

      <p class="mt-1.5 font-serif text-[10px] font-bold tracking-wide text-[rgba(193,127,36,0.85)]">
        사용 가능한 포인트
      </p>
      <div class="mt-2 flex items-center justify-between">
        <p class="font-pen text-[30px] leading-none text-[#2c1810]">
          {{ pointBalance.toLocaleString('ko-KR') }} <span class="font-serif text-lg">P</span>
        </p>
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[rgba(193,127,36,0.45)] bg-[#fff8ec] font-serif text-sm font-bold text-[#c17f24]"
        >
          P
        </div>
      </div>
    </section>
  </div>
</template>
