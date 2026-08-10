<script setup>
defineProps({
  name: {
    type: String,
    default: '김투자',
  },
  sealLabel: {
    type: String,
    default: '확인',
  },
})
</script>

<template>
  <div class="flex w-full items-center justify-end gap-2">
    <span class="font-serif text-[9px] text-[var(--auth-doc-faint)]">신청인</span>
    <span class="font-pen text-[22px] leading-none text-[var(--auth-hand)]">{{ name }}</span>
    <div class="flex h-[23px] w-[34px] items-center justify-center">
      <div class="rotate-8 rounded border-[0.5px] border-[var(--auth-seal)] px-[7px] py-[3px]">
        <span class="font-serif text-[9px] font-black whitespace-nowrap text-[var(--auth-seal)]">
          {{ sealLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
