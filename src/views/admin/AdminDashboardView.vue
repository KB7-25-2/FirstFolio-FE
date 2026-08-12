<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'

const userStore = useUserStore()
const { nickname, roleCode } = storeToRefs(userStore)

const upcoming = [
  { label: '커리큘럼 (대단원·소단원)', phase: 'A1' },
  { label: '강좌 JSON 버전·게시', phase: 'A2' },
  { label: '퀴즈 문항 검수·게시', phase: 'A3' },
  { label: '모의 금융상품', phase: 'A4' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <p class="text-[12px] tracking-wide text-[#6b7280]">ADMIN CONSOLE</p>
    <h2 class="mt-1 text-[22px] font-semibold tracking-tight text-[#111827]">
      안녕하세요{{ nickname ? `, ${nickname}` : '' }}
    </h2>
    <p class="mt-2 text-[14px] leading-relaxed text-[#4b5563]">
      관리자 라우트와 인가 가드가 분리된 상태입니다. 역할 코드
      <code class="rounded bg-[#eef0f4] px-1.5 py-0.5 text-[12px] font-medium text-[#111827]">{{
        roleCode || '—'
      }}</code
      >로 접근 중입니다.
    </p>

    <section class="mt-8 rounded-lg border border-[#e2e5eb] bg-white p-5">
      <h3 class="text-[13px] font-semibold text-[#111827]">다음 단계</h3>
      <ul class="mt-3 flex flex-col gap-2">
        <li
          v-for="item in upcoming"
          :key="item.phase"
          class="flex items-center justify-between rounded-md bg-[#f8f9fb] px-3 py-2.5 text-[13px]"
        >
          <span class="text-[#374151]">{{ item.label }}</span>
          <span class="font-mono text-[11px] text-[#9ca3af]">{{ item.phase }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
