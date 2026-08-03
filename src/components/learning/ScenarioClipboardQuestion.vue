<script setup>
defineProps({
  stepNumber: {
    type: Number,
    required: true,
  },
  stepTotal: {
    type: Number,
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded border border-[rgba(184,173,148,0.5)] bg-[#faf5eb] px-4 py-4 shadow-[2px_3px_0_rgba(61,31,8,0.06)]"
  >
    <div
      class="pointer-events-none absolute top-2 right-3 h-2.5 w-10 rotate-[4deg] bg-[rgba(217,209,184,0.75)]"
      aria-hidden="true"
    />
    <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
      CLIPBOARD · {{ stepNumber }} / {{ stepTotal }}
    </p>
    <p
      class="mt-2 font-serif text-[14px] leading-[22px] font-bold whitespace-pre-line text-[#29211a]"
    >
      {{ prompt }}
    </p>
    <div class="mt-4 flex flex-col gap-3">
      <slot />
    </div>
  </div>
</template>
