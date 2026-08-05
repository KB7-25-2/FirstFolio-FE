<script setup>
import ChapterProgress from '@/components/learning/ChapterProgress.vue'
import LevelTestResultNote from '@/components/onboarding/LevelTestResultNote.vue'
import { useLevelTestResult } from '@/composables/useLevelTestResult.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const { resultRows } = useLevelTestResult()

const goCurriculum = () => {
  router.push({ name: 'onboarding-curriculum' })
}
</script>

<template>
  <div class="mx-auto flex mobile-frame flex-col overflow-hidden bg-[#0d1117]">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
      <ChapterProgress chapter-label="DIAGNOSIS" title="진단 결과" :current="4" :total="4" />

      <div class="mt-5 w-full max-w-[359px] self-center">
        <LevelTestResultNote :rows="resultRows" />
      </div>
    </div>

    <div class="flex shrink-0 px-4 pt-2 pb-6">
      <button
        type="button"
        class="btn-hover flex h-12 w-full items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec]"
        @click="goCurriculum"
      >
        추천 보기 →
      </button>
    </div>
  </div>
</template>
