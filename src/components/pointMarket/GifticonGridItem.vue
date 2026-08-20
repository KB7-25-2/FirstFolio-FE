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
// 추정하는 프레젠테이션 전용 로직이다 — 못 알아본 브랜드는 기본 골드로 떨어진다.
const BRAND_ACCENT = [
  { keywords: ['배달의민족', '배민'], color: '#2f8f7a' },
  { keywords: ['CU'], color: '#8a5fb5' },
  { keywords: ['GS25', 'GS'], color: '#3f7fb0' },
]
const DEFAULT_ACCENT = '#c17f24'

const accentColor = computed(() => {
  const match = BRAND_ACCENT.find(({ keywords }) =>
    keywords.some((keyword) => props.gifticon.displayName.includes(keyword)),
  )
  return match?.color ?? DEFAULT_ACCENT
})

// "선택"(구매 대상으로 고른 상태)과 헷갈리지 않게, 품절은 작은 코너 뱃지가 아니라
// 이미지 전체를 덮는 도장 형태로 확실히 다르게 보여준다.
const isSoldOut = computed(() => props.gifticon.stockStatus === 'SOLD_OUT')
</script>

<template>
  <button
    type="button"
    class="flex flex-col items-start gap-2 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-3 text-left shadow-[0_4px_12px_rgba(44,24,16,0.1)] transition-shadow disabled:cursor-not-allowed disabled:opacity-50"
    :class="isSelected ? 'ring-2 ring-[#c17f24]' : ''"
    :disabled="!gifticon.isRedeemable"
    @click="$emit('select', gifticon)"
  >
    <div
      class="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-[2px] bg-[rgba(193,127,36,0.08)]"
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
        class="line-clamp-2 px-2 text-center font-serif text-xs font-black"
        :class="gifticon.isRedeemable ? 'text-[#2c1810]' : 'text-[rgba(41,33,26,0.4)]'"
      >
        {{ gifticon.displayName }}
      </span>
      <span
        v-if="isSelected"
        class="absolute top-1.5 right-1.5 rounded-full bg-[#c17f24] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#fff8ec]"
      >
        선택
      </span>

      <!-- 품절: "선택" 코너 뱃지와 헷갈리지 않게, 이미지 전체를 어둡게 덮고 가운데 도장처럼 보여준다. -->
      <div
        v-else-if="isSoldOut"
        class="absolute inset-0 flex items-center justify-center bg-[rgba(44,24,16,0.55)]"
      >
        <span
          class="-rotate-6 rounded-[2px] border-2 border-[#fff8ec] px-2 py-0.5 font-serif text-[11px] font-black tracking-wider text-[#fff8ec]"
        >
          품절
        </span>
      </div>

      <!-- 재고는 있지만 포인트가 부족한 경우는 기존처럼 작은 코너 뱃지만 보여준다. -->
      <span
        v-else-if="!gifticon.isRedeemable"
        class="absolute top-1.5 right-1.5 rounded-full bg-[#fff8ec] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[rgba(41,33,26,0.5)]"
      >
        {{ gifticon.statusLabel }}
      </span>
    </div>

    <div>
      <p class="font-serif text-sm font-bold text-[#2c1810]">{{ gifticon.displayName }}</p>
      <div class="mt-1 flex items-baseline gap-1.5">
        <p class="font-serif text-xs text-[rgba(41,33,26,0.45)]">
          {{ gifticon.pricePoints.toLocaleString('ko-KR') }}원
        </p>
        <p class="font-serif text-sm font-bold" :style="{ color: accentColor }">
          {{ gifticon.pricePoints.toLocaleString('ko-KR') }}P
        </p>
      </div>
    </div>
  </button>
</template>
