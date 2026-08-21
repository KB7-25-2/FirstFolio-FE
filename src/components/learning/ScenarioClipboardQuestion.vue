<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 고객 시나리오 본문 (narrative 또는 prompt) */
  prompt: { type: String, required: true },
  scenarioLabel: { type: String, default: '고객 시나리오' },
  /** @type {import('vue').PropType<{ assets?: string, risk?: string, goal?: string } | null>} */
  requirements: { type: Object, default: null },
  requirementsLabel: { type: String, default: '고객 요구사항' },
})

const requirementRows = computed(() => {
  const req = props.requirements
  if (!req || typeof req !== 'object') return []
  return [
    { key: 'assets', label: '자산', value: req.assets },
    { key: 'risk', label: '리스크', value: req.risk },
    { key: 'goal', label: '목표', value: req.goal },
  ].filter((row) => Boolean(String(row.value ?? '').trim()))
})
</script>

<template>
  <div>
    <div v-if="requirementRows.length" class="mb-3">
      <p class="font-serif text-[11px] text-[rgba(139,100,60,0.7)]">{{ requirementsLabel }}</p>
      <div
        class="mt-1.5 overflow-hidden rounded-[8px] border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[rgba(250,232,168,0.45)]"
      >
        <div
          v-for="(row, index) in requirementRows"
          :key="row.key"
          class="flex items-center justify-between gap-2 px-2.5 py-1.5"
          :class="
            index < requirementRows.length - 1
              ? 'border-b-[0.5px] border-[rgba(193,127,36,0.22)]'
              : ''
          "
        >
          <span class="shrink-0 font-serif text-[10px] font-bold text-[#8b5014]">
            {{ row.label }}
          </span>
          <span class="min-w-0 truncate text-right text-[11px] font-bold text-[#3d1f08]">
            {{ row.value }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="scenarioLabel" class="font-serif text-[11px] text-[rgba(139,100,60,0.7)]">
      {{ scenarioLabel }}
    </p>
    <p class="mt-1 text-[12px] leading-[18px] text-[#3d1f08]" :class="scenarioLabel ? '' : 'mt-0'">
      {{ prompt }}
    </p>
    <div class="mt-3 flex flex-col gap-1.5">
      <slot />
    </div>
    <div class="mt-3">
      <slot name="footer" />
    </div>
  </div>
</template>
