<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
  sealLabel: {
    type: String,
    default: '확인',
  },
  /**
   * null/undefined: 항상 표시
   * false: 도장 대기(숨김)
   * true: 찍힘 애니메이션
   */
  stamped: {
    type: Boolean,
    default: undefined,
  },
})
</script>

<template>
  <div class="flex w-full items-center justify-end gap-2">
    <span class="font-serif text-[9px] text-[var(--auth-doc-faint)]">신청인</span>
    <span class="font-serif text-[18px] leading-none font-bold text-[var(--auth-hand)]">{{
      name
    }}</span>
    <div class="flex h-[28px] min-w-[40px] items-center justify-center">
      <div
        class="auth-seal rounded border-[1.5px] border-[var(--auth-seal)] px-2 py-0.5"
        :class="{
          'auth-seal--pending': stamped === false,
          'auth-seal--stamped': stamped === true,
          'rotate-1': stamped == null,
        }"
      >
        <span
          class="font-serif text-[10px] font-black tracking-[1px] whitespace-nowrap text-[var(--auth-seal)]"
        >
          {{ sealLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
