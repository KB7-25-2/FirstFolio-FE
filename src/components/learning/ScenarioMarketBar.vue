<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    default: '오늘의 금융 시황',
  },
  bullets: {
    type: Array,
    default: () => [],
  },
  constraints: {
    type: Array,
    default: () => [],
  },
})

const expanded = ref(false)
</script>

<template>
  <div
    class="overflow-hidden rounded-t-lg border border-b-0 border-[rgba(184,173,148,0.45)] bg-[#2c241c] text-[#f5edd9]"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="font-serif text-[12px] font-bold tracking-wide">{{ title }}</span>
      <span class="font-serif text-[11px] text-[rgba(245,237,217,0.65)]">
        {{ expanded ? '접기 ▲' : '펼치기 ▼' }}
      </span>
    </button>
    <div v-show="expanded" class="border-t border-[rgba(245,237,217,0.12)] px-4 pt-2 pb-4">
      <ul v-if="bullets.length" class="flex flex-col gap-1.5">
        <li
          v-for="(item, index) in bullets"
          :key="`m-${index}`"
          class="font-serif text-[11px] leading-[17px] text-[rgba(245,237,217,0.85)]"
        >
          · {{ item }}
        </li>
      </ul>
      <template v-if="constraints.length">
        <p
          class="mt-3 font-serif text-[10px] font-black tracking-wide text-[rgba(193,127,36,0.95)]"
        >
          제약 조건
        </p>
        <ul class="mt-1.5 flex flex-col gap-1">
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
