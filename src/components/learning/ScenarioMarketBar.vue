<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, default: '오늘의 금융 시황' },
  date: { type: String, default: '' },
  bullets: { type: Array, default: () => [] },
  constraints: { type: Array, default: () => [] },
})

const expanded = ref(false)
</script>

<template>
  <div class="shrink-0 border-t border-[rgba(255,255,255,0.06)] bg-[#1e2235]">
    <button
      type="button"
      class="flex h-12 w-full items-center justify-between px-[18px] text-left"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="flex items-center gap-2">
        <span
          class="inline-block size-4 rounded-[1.5px] border-[0.5px] border-[rgba(249,250,251,0.85)]"
          aria-hidden="true"
        />
        <span class="font-serif text-[13px] font-medium text-[#f9fafb]">{{ title }}</span>
      </span>
      <span class="flex items-center gap-2 text-[12px] text-[#6b7380]">
        <span v-if="date">{{ date }}</span>
        <span>{{ expanded ? '⌃' : '⌄' }}</span>
      </span>
    </button>
    <div v-show="expanded" class="border-t border-[rgba(255,255,255,0.08)] px-[18px] pt-2 pb-4">
      <ul v-if="bullets.length" class="flex flex-col gap-1">
        <li
          v-for="(item, index) in bullets"
          :key="`m-${index}`"
          class="font-serif text-[11px] leading-[17px] text-[rgba(245,237,217,0.85)]"
        >
          · {{ item }}
        </li>
      </ul>
      <template v-if="constraints.length">
        <p class="mt-2 font-serif text-[10px] font-bold text-[#c17f24]">제약 조건</p>
        <ul class="mt-1 flex flex-col gap-1">
          <li
            v-for="(item, index) in constraints"
            :key="`c-${index}`"
            class="font-serif text-[11px] leading-[17px] text-[rgba(245,237,217,0.8)]"
          >
            · {{ item }}
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
