<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  example: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  footer: {
    type: String,
    default: '',
  },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="더 알아보기"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/45"
        aria-label="닫기"
        @click="$emit('close')"
      />
      <div
        class="relative z-10 flex w-full max-w-[393px] flex-col gap-4 rounded-t-[24px] bg-[#faf5eb] px-5 pt-3 pb-7 shadow-[0_8px_10px_rgba(0,0,0,0.28)]"
      >
        <div class="mx-auto h-1 w-10 shrink-0 rounded bg-[#c7c2b8]" aria-hidden="true" />
        <div class="flex h-7 items-center justify-between">
          <p class="text-[14px] font-bold text-[#1f2e59]">더 알아보기</p>
          <button
            type="button"
            class="text-[12px] font-medium text-[#8c8f9e]"
            @click="$emit('close')"
          >
            닫기
          </button>
        </div>
        <div class="flex w-full flex-col gap-3 rounded-xl border border-[#e0e0e5] bg-white p-4">
          <p v-if="title" class="text-[14px] font-bold text-[#1f2e59]">{{ title }}</p>
          <p v-if="example" class="text-[12px] text-[#666b75]">{{ example }}</p>
          <p v-if="body" class="text-[12px] leading-5 whitespace-pre-line text-[#1f2e59]">
            {{ body }}
          </p>
        </div>
        <p v-if="footer" class="text-center text-[11px] text-[#8c8f9e]">{{ footer }}</p>
      </div>
    </div>
  </Teleport>
</template>
