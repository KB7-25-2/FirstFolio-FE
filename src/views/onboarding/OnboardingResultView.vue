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
  <div class="cork-board mx-auto flex mobile-frame flex-col overflow-hidden">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-3">
      <ChapterProgress chapter-label="DIAGNOSIS" title="진단 결과" :current="4" :total="4" />

      <div class="mt-5 w-full max-w-[359px] self-center">
        <LevelTestResultNote :rows="resultRows" />
      </div>
    </div>

    <div class="flex shrink-0 px-4 pt-2 pb-6">
      <button type="button" class="cork-btn cork-btn--primary flex-1" @click="goCurriculum">
        추천 보기 →
      </button>
    </div>
  </div>
</template>
