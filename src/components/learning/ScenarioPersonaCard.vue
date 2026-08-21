<script setup>
defineProps({
  name: { type: String, required: true },
  age: { type: String, default: '' },
  job: { type: String, default: '' },
  monthlyIncome: { type: String, default: '' },
  monthlySaving: { type: String, default: '' },
})
</script>

<template>
  <div
    class="w-[148px] overflow-hidden rounded-[14px] border-[0.5px] border-[rgba(255,255,255,0.3)] bg-[rgba(20,26,41,0.68)] px-2.5 py-2 backdrop-blur-[10px]"
  >
    <p class="font-serif text-[11px] text-[#f5c76b]">고객 프로필</p>
    <div
      class="mt-1 flex min-h-[26px] items-center gap-1.5 overflow-hidden rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-1"
    >
      <span class="size-2.5 shrink-0 rounded-full bg-[#5b8def]" aria-hidden="true" />
      <p class="truncate font-serif text-[12px] font-bold text-[#f5edd9]">{{ name }}</p>
    </div>
    <div class="mt-2 flex gap-1.5">
      <div
        class="min-h-[34px] flex-1 overflow-hidden rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-1"
      >
        <p class="text-[8px] text-[#bfb8a8]">나이</p>
        <p class="text-[11px] font-bold text-[#f5edd9]">{{ age }}</p>
      </div>
      <div
        class="min-h-[34px] flex-1 overflow-hidden rounded-md bg-[rgba(255,255,255,0.12)] px-2 py-1"
      >
        <p class="text-[8px] text-[#bfb8a8]">직업</p>
        <p class="text-[11px] font-bold text-[#f5edd9]">{{ job }}</p>
      </div>
    </div>
  </div>
</template>
