<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import JsBarcode from 'jsbarcode'

// GifticonCodeDisclosureResponse.barcode_format 값을 JsBarcode가 아는 포맷 이름으로 변환.
// 지금 서버는 CODE_128만 내려주지만(GifticonCryptoService 참고), 나중에 다른 포맷이 추가돼도
// 매핑만 늘리면 되게 분리해둔다.
const BARCODE_FORMAT_MAP = {
  CODE_128: 'CODE128',
}

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    default: 'CODE_128',
  },
})

const svgRef = ref(null)
const renderError = ref(null)

const render = async () => {
  renderError.value = null
  await nextTick()
  if (!svgRef.value || !props.value) return

  try {
    JsBarcode(svgRef.value, props.value, {
      format: BARCODE_FORMAT_MAP[props.format] ?? 'CODE128',
      displayValue: false,
      margin: 0,
      height: 56,
      width: 2,
      background: 'transparent',
      lineColor: '#2c1810',
    })

    // JsBarcode는 svg에 width/height를 고정 px 값으로 박아넣고 viewBox는 안 넣어준다.
    // 그 상태로 CSS만 걸면(w-full 등) 줄어들지 않고 그냥 잘리거나 넘친다 — 렌더 직후
    // viewBox를 채워서 CSS 크기에 맞춰 비율대로 축소되게 만든다.
    const svg = svgRef.value
    const w = svg.getAttribute('width')
    const h = svg.getAttribute('height')
    if (w && h) {
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
    }
  } catch (err) {
    // JsBarcode는 포맷에 안 맞는 값이면 예외를 던진다(예: 서버가 준 값이 CODE128 인코딩 범위를
    // 벗어난 문자를 포함한 경우) — 화면이 깨지는 대신 폴백 문구를 보여준다.
    renderError.value = '바코드를 표시할 수 없어요. 코드를 직접 입력해 사용해 주세요.'
    console.warn('[GifticonBarcode] 바코드 렌더링 실패', err)
  }
}

onMounted(render)
watch(() => [props.value, props.format], render)
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <svg
      v-show="!renderError"
      ref="svgRef"
      class="h-14 w-full max-w-full"
      role="img"
      :aria-label="`바코드 ${value}`"
    />
    <p v-if="renderError" class="font-serif text-xs text-[#c0433f]">{{ renderError }}</p>
  </div>
</template>
