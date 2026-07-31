<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

const route = useRoute()
const router = useRouter()

const subChapterId = computed(() => Number(route.params.subChapterId))

const goQuiz = () => {
  router.push({
    name: 'learning-quiz',
    params: { subChapterId: subChapterId.value },
  })
}

const stopLearning = () => {
  router.back()
}
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader title="개념 정리" :eyebrow="`소단원 #${subChapterId}`" />
    </template>

    <LearningNotePaper ruled surface-class="bg-[#f7f1e4]">
      <div class="px-5 py-6">
        <p class="font-serif text-[11px] tracking-wide text-[rgba(139,100,60,0.55)]">
          TEXTBOOK · 핵심 개념
        </p>
        <p class="mt-3 font-pen text-[22px] text-[#212b5c]">학습 진행 화면 준비 중</p>
        <p class="mt-2 font-serif text-sm leading-relaxed text-[rgba(61,31,8,0.75)]">
          소단원 강좌 페이지는 이후 이슈에서 연결합니다.
        </p>
      </div>
    </LearningNotePaper>

    <template #footer>
      <div class="mt-6 flex gap-3">
        <button
          type="button"
          class="flex-1 rounded bg-[#b33a3a] py-3 font-serif text-sm font-bold text-white"
          @click="stopLearning"
        >
          학습 중단
        </button>
        <button
          type="button"
          class="flex-1 rounded bg-[var(--nav-active-primary)] py-3 font-serif text-sm font-bold text-[#fff8ec]"
          @click="goQuiz"
        >
          퀴즈 풀기 →
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
