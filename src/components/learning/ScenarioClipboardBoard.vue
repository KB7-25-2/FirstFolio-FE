<script setup>
defineProps({
  paperTitle: {
    type: String,
    default: '',
  },
  /** true면 부모 높이를 채워 내부 스크롤 가능하게 함 */
  fill: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="relative w-full rounded-[14px] border-[0.5px] border-[#5a3820] shadow-[0_6px_28px_rgba(0,0,0,0.45)]"
    :class="fill ? 'flex h-full min-h-0 flex-1 flex-col' : ''"
    style="background-image: linear-gradient(150deg, #4a2e1a 8%, #3a2010 58%, #2e1a0c 92%)"
  >
    <!-- metal clip -->
    <div class="absolute top-[-2px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
      <div
        class="h-[18px] w-[52px] rounded-t-[3px] rounded-b-[2px] shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
        style="background-image: linear-gradient(180deg, #b0b0b0 0%, #888 40%, #aaa 60%, #999 100%)"
      >
        <div class="mx-auto mt-[3px] h-[3px] w-[42px] rounded bg-[rgba(255,255,255,0.25)]" />
        <div
          class="mx-auto mt-[3px] h-2 w-9 rounded-b bg-gradient-to-b from-[#999] to-[#777] shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        />
      </div>
      <div class="mt-0.5 h-[5px] w-5 rounded-b bg-[rgba(0,0,0,0.18)]" />
    </div>

    <div class="p-[0.8px] pt-0" :class="fill ? 'flex min-h-0 flex-1 flex-col' : ''">
      <div class="px-2 pt-[22px] pb-2" :class="fill ? 'flex min-h-0 flex-1 flex-col' : ''">
        <div
          class="relative overflow-hidden rounded-t-[4px] rounded-b-[10px] border-[0.5px] border-[#d4b896] shadow-[0_1px_0_rgba(255,255,255,0.5)]"
          :class="fill ? 'flex min-h-0 flex-1 flex-col' : ''"
          style="background-image: linear-gradient(180deg, #f2e8d0 0%, #f5edd8 30%, #f0e5cc 100%)"
        >
          <div
            v-if="paperTitle"
            class="relative flex shrink-0 items-center justify-center border-b-[0.8px] border-[rgba(139,100,60,0.2)] px-4 pt-2.5 pb-2.5"
          >
            <span
              class="absolute top-4 left-3 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
            <span
              class="absolute top-4 right-3 size-2 rounded bg-[rgba(0,0,0,0.12)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
            <p class="font-serif text-[14px] font-bold tracking-[0.7px] text-[#3d1f08]">
              {{ paperTitle }}
            </p>
          </div>
          <div
            class="relative px-3 pt-1 pb-3"
            :class="fill ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''"
          >
            <slot />
          </div>
          <div
            class="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]"
          />
        </div>
      </div>
    </div>
  </div>
</template>
