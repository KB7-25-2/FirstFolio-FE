<script setup>
import { computed } from 'vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'

// holding: {
//   holdingId, displayName, assetType,
//   cycleSummary,      // 백엔드가 완성 문자열로 내려줌 ("서비스 6일 만기 · 실제 6개월")
//   quantity, principalAmount
// }
const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
})

defineEmits(['request-sell'])

const dotClass = computed(() => getAssetTypeMeta(props.holding.assetType).dotClass)

const formattedAmount = computed(() => `${props.holding.principalAmount.toLocaleString('ko-KR')}원`)
</script>

<template>
  <li
    class="group flex items-center justify-between gap-3 border border-transparent px-3 py-3 transition-all hover:mx-1 hover:my-1 hover:rounded-xl hover:border-[var(--pf-highlight)] hover:bg-white/12"
  >
    <div class="flex min-w-0 items-start gap-2">
      <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="dotClass" />
      <div class="min-w-0">
        <p class="truncate font-bold text-[var(--pf-text)]">{{ holding.displayName }}</p>
        <p class="truncate text-xs text-[var(--pf-text-muted)]">{{ holding.cycleSummary }}</p>
        <p class="mt-1 text-lg font-bold text-[var(--pf-highlight)]">{{ formattedAmount }}</p>
      </div>
    </div>

    <button
      type="button"
      class="shrink-0 rounded-full border border-[var(--pf-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--pf-text)] transition-colors group-hover:border-transparent group-hover:bg-[var(--pf-cta-bg)] group-hover:text-[var(--pf-cta-text)]"
      @click="$emit('request-sell', holding)"
    >
      판매
    </button>
  </li>
</template>
