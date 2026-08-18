<script setup>
defineProps({
  /** 압정 위치 */
  side: {
    type: String,
    default: 'center',
    validator: (value) => ['left', 'center', 'right'].includes(value),
  },
  /** 색 톤 */
  tone: {
    type: String,
    default: 'study',
    validator: (value) => ['study', 'quest', 'portfolio', 'news', 'red', 'gold'].includes(value),
  },
})
</script>

<template>
  <span
    class="memo-pin pointer-events-none absolute z-30"
    :class="[`memo-pin--${side}`, `memo-pin--${tone}`]"
    aria-hidden="true"
  >
    <span class="memo-pin__head" />
    <span class="memo-pin__needle" />
  </span>
</template>
