<script setup>
defineProps({
  prompt: { type: String, required: true },
  scenarioLabel: { type: String, default: '고객 시나리오' },
})
</script>

<template>
  <div>
    <p class="font-pen text-[11px] text-[rgba(139,100,60,0.7)]">{{ scenarioLabel }}</p>
    <p class="mt-1 text-[12px] leading-[18px] text-[#3d1f08]">{{ prompt }}</p>
    <div class="mt-3 flex flex-col gap-1.5">
      <slot />
    </div>
    <div class="mt-3">
      <slot name="footer" />
    </div>
  </div>
</template>
