<script setup>
import { RouterLink } from 'vue-router'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-[#0d1117]">
    <div class="mobile-frame flex flex-col items-center justify-center px-6">
      <div class="w-full max-w-[300px] rotate-[-1.2deg]">
        <LearningNotePaper ruled>
          <div class="px-5 pt-8 pb-6 text-center">
            <p class="font-serif text-[10px] tracking-[0.18em] text-[rgba(41,33,26,0.45)]">
              ERROR 404
            </p>
            <h1 class="mt-2 font-serif text-[22px] font-black text-[#29211a]">
              페이지를 찾을 수 없어요
            </h1>
            <p class="mt-3 font-serif text-[13px] leading-5 text-[rgba(41,33,26,0.65)]">
              주소가 잘못되었거나,<br />
              더 이상 존재하지 않는 페이지입니다.
            </p>
            <RouterLink
              to="/home"
              class="btn-hover mt-6 inline-flex h-11 items-center justify-center rounded bg-[#c17f24] px-5 font-serif text-[14px] font-bold text-[#f5edd9]"
            >
              홈으로 돌아가기
            </RouterLink>
          </div>
        </LearningNotePaper>
      </div>
    </div>
  </div>
</template>
