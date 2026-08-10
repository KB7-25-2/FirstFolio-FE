<script setup>
defineProps({
  pointBalance: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <section class="rounded-2xl border-[0.5px] border-white/10 bg-white/[0.04] p-4">
    <p class="text-xs text-[#9aa1b0]">사용 가능한 포인트</p>
    <div class="mt-2 flex items-center justify-between">
      <p class="text-3xl font-bold text-white">
        {{ pointBalance.toLocaleString('ko-KR') }} <span class="text-lg">P</span>
      </p>
      <div
        class="flex size-11 items-center justify-center rounded-full bg-[#6b6478] text-sm font-bold text-white"
      >
        P
      </div>
    </div>
  </section>
</template>
