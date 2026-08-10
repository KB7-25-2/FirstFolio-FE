<script setup>
import { computed } from 'vue'

const props = defineProps({
  gifticon: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

// 브랜드별 포인트 텍스트 색상. 실제 API엔 브랜드 색상 필드가 없어서, 알려진 브랜드명 키워드로
// 추정하는 프레젠테이션 전용 로직이다 — 못 알아본 브랜드는 기본 금색으로 떨어진다.
const BRAND_ACCENT = [
  { keywords: ['배달의민족', '배민'], color: '#2AC1BC' },
  { keywords: ['CU'], color: '#8B5CF6' },
  { keywords: ['GS25', 'GS'], color: '#4FC3F7' },
]
const DEFAULT_ACCENT = '#f5a647'

const accentColor = computed(() => {
  const match = BRAND_ACCENT.find(({ keywords }) =>
    keywords.some((keyword) => props.gifticon.displayName.includes(keyword)),
  )
  return match?.color ?? DEFAULT_ACCENT
})
</script>

<template>
  <button
    type="button"
    class="flex flex-col items-start gap-2 rounded-2xl border-[0.5px] p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      isSelected
        ? 'border-[#8B93A6] bg-white/[0.08]'
        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
    "
    :disabled="!gifticon.isRedeemable"
    @click="$emit('select', gifticon)"
  >
    <div
      class="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-[#f2f2f0]"
    >
      <img
        v-if="gifticon.imageUrl"
        :src="gifticon.imageUrl"
        alt=""
        class="h-full w-full object-cover"
        :class="{ 'opacity-40 grayscale': !gifticon.isRedeemable }"
      />
      <span
        v-else
        class="line-clamp-2 px-2 text-center text-xs font-black"
        :class="gifticon.isRedeemable ? 'text-[#1a1a1a]' : 'text-[#9aa1b0]'"
      >
        {{ gifticon.displayName }}
      </span>
      <span
        v-if="isSelected"
        class="absolute top-1.5 right-1.5 rounded-full bg-[#4B4468] px-1.5 py-0.5 text-[9px] font-bold text-white"
      >
        선택
      </span>
      <span
        v-else-if="!gifticon.isRedeemable"
        class="absolute top-1.5 right-1.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] font-bold text-[#6b6b6b]"
      >
        {{ gifticon.statusLabel }}
      </span>
    </div>

    <div>
      <p class="text-sm font-bold text-white">{{ gifticon.displayName }}</p>
      <div class="mt-1 flex items-baseline gap-1.5">
        <p class="text-xs text-[#9aa1b0]">{{ gifticon.pricePoints.toLocaleString('ko-KR') }}원</p>
        <p class="text-sm font-bold" :style="{ color: accentColor }">
          {{ gifticon.pricePoints.toLocaleString('ko-KR') }}P
        </p>
      </div>
    </div>
  </button>
</template>
