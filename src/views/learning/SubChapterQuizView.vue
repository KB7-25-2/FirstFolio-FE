<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'

const route = useRoute()
const router = useRouter()

const subChapterId = computed(() => Number(route.params.subChapterId))

const giveUp = () => {
  router.back()
}
</script>

<template>
  <LearningLayout immersive>
    <template #header>
      <LearningPageHeader title="시험지" :eyebrow="`소단원 #${subChapterId} · 퀴즈`" />
    </template>

    <LearningNotePaper ruled surface-class="bg-[#f7f1e4]">
      <div class="px-5 py-6">
        <p class="font-serif text-base font-bold text-[#2c1810]">금융 기초 퀴즈 시험</p>
        <p class="mt-4 font-serif text-sm text-[rgba(61,31,8,0.7)]">소단원 퀴즈 화면 준비 중</p>
      </div>
    </LearningNotePaper>

    <template #footer>
      <div class="mt-6 flex gap-3">
        <button
          type="button"
          class="flex-1 rounded bg-[#b33a3a] py-3 font-serif text-sm font-bold text-white"
          @click="giveUp"
        >
          시험 포기
        </button>
        <button
          type="button"
          class="flex-1 rounded bg-[var(--nav-active-primary)] py-3 font-serif text-sm font-bold text-[#fff8ec]"
          disabled
        >
          정답 제출
        </button>
      </div>
    </template>
  </LearningLayout>
</template>
