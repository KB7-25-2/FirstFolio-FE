<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex gap-3 rounded border border-[rgba(184,173,148,0.45)] bg-[#fff8ec] px-3 py-3">
    <div
      class="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8dcc4] font-serif text-[14px] font-black text-[#5a4030]"
      aria-hidden="true"
    >
      {{ name.slice(0, 1) }}
    </div>
    <div class="min-w-0 text-left">
      <p class="font-serif text-[13px] font-black text-[#29211a]">{{ name }}</p>
      <p v-if="role" class="mt-0.5 font-serif text-[11px] text-[rgba(139,100,60,0.85)]">
        {{ role }}
      </p>
      <p
        v-if="summary"
        class="mt-1.5 font-serif text-[11px] leading-[17px] text-[rgba(41,33,26,0.8)]"
      >
        {{ summary }}
      </p>
    </div>
  </div>
</template>
