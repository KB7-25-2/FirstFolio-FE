<script setup>
import { computed } from 'vue'
import idlePenguin from '@/assets/study/penguin.png'
import correctPenguin from '@/assets/study/correct_penguin.webp'
import wrongPenguin from '@/assets/study/wrong_penguin.webp'

const props = defineProps({
  /** @type {import('vue').PropType<'idle' | 'correct' | 'wrong'>} */
  mood: {
    type: String,
    default: 'idle',
    validator: (value) => ['idle', 'correct', 'wrong'].includes(value),
  },
})

const src = computed(() => {
  if (props.mood === 'correct') return correctPenguin
  if (props.mood === 'wrong') return wrongPenguin
  return idlePenguin
})

const isIdle = computed(() => props.mood === 'idle')
</script>

<template>
  <div
    class="scenario-mascot pointer-events-none"
    :class="{
      'scenario-mascot--idle': isIdle,
      'scenario-mascot--react': !isIdle,
    }"
    aria-hidden="true"
  >
    <Transition name="scenario-mascot-swap" mode="out-in">
      <img
        :key="mood"
        :src="src"
        alt=""
        class="h-[148px] w-[200px] object-contain"
        width="200"
        height="148"
        decoding="async"
        draggable="false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.scenario-mascot {
  /* 위치 오프셋 — animation transform과 분리 (여기만 바꾸면 반영됨) */
  --mascot-sink: 30px;
  position: relative;
  top: var(--mascot-sink);
  transform-origin: center bottom;
}

.scenario-mascot--idle {
  animation: scenario-mascot-breath 2.6s ease-in-out infinite;
  will-change: transform;
}

.scenario-mascot--react {
  animation: scenario-mascot-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.scenario-mascot-swap-enter-active,
.scenario-mascot-swap-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.scenario-mascot-swap-enter-from,
.scenario-mascot-swap-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

@keyframes scenario-mascot-breath {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes scenario-mascot-pop {
  0% {
    transform: translateY(8px) scale(0.92);
    opacity: 0.7;
  }
  60% {
    transform: translateY(-3px) scale(1.04);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scenario-mascot--idle,
  .scenario-mascot--react {
    animation: none;
  }

  .scenario-mascot-swap-enter-from,
  .scenario-mascot-swap-leave-to {
    transform: none;
  }
}
</style>
