<script setup>
import { computed, ref } from 'vue'
import { useGifticonStore } from '@/store/gifticonStore.js'
import GifticonBarcode from '@/components/pointMarket/GifticonBarcode.vue'

// 실제 서버엔 REQUESTED/SENT/COMPLETED 같은 배송 상태가 없다 — 교환은 즉시 완료되고,
// 이후엔 "코드를 확인했는지"만 남는다(UNDISCLOSED/DISCLOSED/EXPIRED, gifticonMapper 기준).
const STATUS_DOT_CLASS = {
  UNDISCLOSED: 'bg-[#c17f24]',
  DISCLOSED: 'bg-[#1D9E75]',
  EXPIRED: 'bg-[rgba(41,33,26,0.3)]',
}

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
})

const gifticonStore = useGifticonStore()

const isRevealing = ref(false)
const revealError = ref(null)
const disclosure = ref(null)

const dotClass = computed(() => STATUS_DOT_CLASS[props.order.status] ?? 'bg-[rgba(41,33,26,0.3)]')

const completedAtLabel = computed(() => {
  if (!props.order.completedAt) return ''
  return new Date(props.order.completedAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
})

const canReveal = computed(() => props.order.status !== 'EXPIRED')

const revealCode = async () => {
  if (disclosure.value) {
    disclosure.value = null // 다시 탭하면 접는다
    return
  }
  isRevealing.value = true
  revealError.value = null
  try {
    disclosure.value = await gifticonStore.discloseCode(props.order.gifticonOrderId)
  } catch (err) {
    revealError.value = err.message || '코드를 불러오지 못했어요.'
  } finally {
    isRevealing.value = false
  }
}
</script>

<template>
  <li
    class="flex flex-col gap-2 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.25)] bg-[#fff8ec] px-3 py-3"
  >
    <button
      type="button"
      class="flex items-center justify-between gap-3 text-left"
      :disabled="!canReveal"
      @click="revealCode"
    >
      <div class="min-w-0">
        <p class="truncate font-serif text-sm font-bold text-[#2c1810]">{{ order.displayName }}</p>
        <p class="mt-0.5 font-serif text-xs text-[rgba(41,33,26,0.45)]">
          {{ completedAtLabel }} 교환 · {{ order.codeMasked }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <span class="size-1.5 rounded-full" :class="dotClass" />
        <span class="font-serif text-xs font-bold text-[#2c1810]">
          {{ isRevealing ? '불러오는 중…' : order.statusLabel }}
        </span>
      </div>
    </button>

    <p v-if="revealError" class="font-serif text-xs text-[#c0433f]">{{ revealError }}</p>

    <div
      v-if="disclosure"
      class="flex flex-col items-center gap-2 rounded-[3px] border-[0.5px] border-dashed border-[rgba(193,127,36,0.4)] bg-[#fffdf7] px-3 py-3"
    >
      <GifticonBarcode :value="disclosure.barcodeValue" :format="disclosure.barcodeFormat" />
      <p class="font-mono text-sm font-bold tracking-wider text-[#2c1810]">
        {{ disclosure.code }}
      </p>
      <p v-if="disclosure.isExpired" class="font-serif text-xs text-[#c0433f]">
        유효기간이 지난 코드예요.
      </p>
      <p v-else-if="disclosure.expiresAt" class="font-serif text-xs text-[rgba(41,33,26,0.45)]">
        {{ new Date(disclosure.expiresAt).toLocaleDateString('ko-KR') }}까지 사용 가능
      </p>
    </div>
  </li>
</template>
