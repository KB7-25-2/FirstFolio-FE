<script setup>
defineProps({
  formula: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="-rotate-[0.6deg]">
    <div class="bg-[#fae8a8] px-3.5 py-3 shadow-[1px_2px_4px_rgba(0,0,0,0.2)]">
      <span
        class="inline-block rounded-[10px] bg-[#212b5c] px-2 py-[3px] font-serif text-[9px] font-black text-[#f5edd9]"
      >
        결론
      </span>
      <p class="mt-2 font-serif text-[14px] font-bold text-[#29211a]">
        {{ formula }}
      </p>
      <p v-if="note" class="mt-1 font-serif font-bold text-[18px] text-[#212b5c]">
        {{ note }}
      </p>
    </div>
  </div>
</template>
