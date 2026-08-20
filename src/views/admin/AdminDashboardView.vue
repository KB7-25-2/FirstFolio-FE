<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'

const userStore = useUserStore()
const { nickname, roleCode } = storeToRefs(userStore)

const upcoming = [
  { label: '커리큘럼 (대단원·소단원)', phase: 'A1 · ready' },
  { label: '강좌 JSON 버전·게시', phase: 'A2' },
  { label: '퀴즈 문항 검수·게시', phase: 'A3' },
  { label: '모의 금융상품', phase: 'A4 · ready' },
  { label: '뉴스 검수', phase: 'A5 · ready' },
]
</script>

<template>
  <div class="admin-page">
    <p class="admin-page__kicker">Overview</p>
    <h2 class="admin-page__title">안녕하세요{{ nickname ? `, ${nickname}` : '' }}</h2>
    <p class="admin-page__desc">
      관리자 콘솔은 유저앱과 별도 디자인·레이아웃으로 구성합니다. 현재 역할
      <span class="admin-code">{{ roleCode || '—' }}</span
      >으로 접근 중이며, 아래 모듈부터 순차 연결합니다.
    </p>

    <section class="admin-card">
      <h3 class="admin-card__title">Roadmap</h3>
      <ul class="admin-list">
        <li v-for="item in upcoming" :key="item.phase" class="admin-list__item">
          <span class="admin-list__label">{{ item.label }}</span>
          <span class="admin-list__meta">{{ item.phase }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
