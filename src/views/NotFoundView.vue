<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-[#0d1117]">
    <div class="mobile-frame flex flex-col items-center justify-center px-6 text-center">
      <p class="font-serif text-[11px] tracking-[0.18em] text-[rgba(245,237,217,0.45)]">
        ERROR 404
      </p>
      <h1 class="mt-3 font-serif text-[28px] font-black text-[#f5edd9]">페이지를 찾을 수 없어요</h1>
      <p class="mt-3 max-w-[260px] font-serif text-[13px] leading-5 text-[rgba(245,237,217,0.55)]">
        주소가 잘못되었거나, 더 이상 존재하지 않는 페이지입니다.
      </p>
      <RouterLink
        to="/home"
        class="btn-hover mt-8 inline-flex h-12 items-center justify-center rounded bg-[#c17f24] px-6 font-serif text-[15px] font-bold text-[#f5edd9]"
      >
        홈으로 돌아가기
      </RouterLink>
    </div>
  </div>
</template>
