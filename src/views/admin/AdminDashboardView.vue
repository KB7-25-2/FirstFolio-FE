<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userStore.js'

const router = useRouter()
const userStore = useUserStore()
const { nickname, roleCode, email } = storeToRefs(userStore)

const MODULES = [
  {
    path: '/admin/curriculum',
    title: '커리큘럼',
    desc: '대단원·소단원 메타데이터와 공개 상태를 관리합니다.',
    tag: '학습',
    tone: 'indigo',
  },
  {
    path: '/admin/quiz',
    title: '퀴즈 문항',
    desc: '문항 작성·수정·게시·폐기와 버전을 관리합니다.',
    tag: '학습',
    tone: 'violet',
  },
  {
    path: '/admin/products',
    title: '모의 금융상품',
    desc: '원천 데이터 가져오기와 가명·시뮬레이션 조건을 설정합니다.',
    tag: '포트폴리오',
    tone: 'sky',
  },
  {
    path: '/admin/gifticons',
    title: '기프티콘',
    desc: '교환 상품·포인트 가격·코드 재고를 등록·관리합니다.',
    tag: '리워드',
    tone: 'amber',
  },
  {
    path: '/admin/news',
    title: '뉴스 검수',
    desc: '공개 금융 뉴스의 제목·요약·썸네일을 검수합니다.',
    tag: '콘텐츠',
    tone: 'emerald',
  },
  {
    path: '/admin/newsletters',
    title: '뉴스레터',
    desc: '뉴스레터 발송 목록을 관리합니다.',
    tag: '콘텐츠',
    tone: 'green',
  },
]

const todayLabel = computed(() =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }),
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '안녕하세요'
  return '수고하셨어요'
})

const goTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="admin-dashboard">
    <header class="admin-dashboard__hero">
      <div class="admin-dashboard__hero-text">
        <p class="admin-dashboard__date">{{ todayLabel }}</p>
        <h2 class="admin-dashboard__title">
          {{ greeting }}<template v-if="nickname">, {{ nickname }}</template>
        </h2>
        <p class="admin-dashboard__desc">
          FirstFolio 운영 콘솔입니다. 학습·포트폴리오·리워드 콘텐츠를 한곳에서 관리하세요.
        </p>
      </div>
      <div class="admin-dashboard__profile">
        <span class="admin-dashboard__role">{{ roleCode || 'ADMIN' }}</span>
        <p v-if="email" class="admin-dashboard__email">{{ email }}</p>
      </div>
    </header>

    <section class="admin-dashboard__section" aria-labelledby="dashboard-modules">
      <div class="admin-dashboard__section-head">
        <h3 id="dashboard-modules" class="admin-dashboard__section-title">운영 메뉴</h3>
        <p class="admin-dashboard__section-desc">{{ MODULES.length }}개 모듈</p>
      </div>

      <ul class="admin-dashboard__grid">
        <li v-for="item in MODULES" :key="item.path">
          <button type="button" class="admin-dashboard__card" @click="goTo(item.path)">
            <div class="admin-dashboard__card-top">
              <span class="admin-dashboard__tag">{{ item.tag }}</span>
              <span class="admin-dashboard__arrow" aria-hidden="true">→</span>
            </div>
            <p class="admin-dashboard__card-title">{{ item.title }}</p>
            <p class="admin-dashboard__card-desc">{{ item.desc }}</p>
            <span
              class="admin-dashboard__accent"
              :class="`admin-dashboard__accent--${item.tone}`"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </section>

    <section class="admin-dashboard__notes admin-card">
      <h3 class="admin-card__title">운영 안내</h3>
      <ul class="admin-dashboard__notes-list">
        <li>관리자 API 변경은 즉시 사용자 앱에 반영됩니다. 게시·폐기 전 내용을 확인하세요.</li>
        <li>문의·장애 대응은 팀 내부 채널을 이용해 주세요.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: 1080px;
}

.admin-dashboard__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px;
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%);
}

.admin-dashboard__date {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-text-muted);
}

.admin-dashboard__title {
  margin: 6px 0 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--admin-text);
}

.admin-dashboard__desc {
  margin: 10px 0 0;
  max-width: 36rem;
  font-size: 14px;
  line-height: 1.55;
  color: var(--admin-text-secondary);
}

.admin-dashboard__profile {
  flex-shrink: 0;
  text-align: right;
}

.admin-dashboard__role {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--admin-accent-soft);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.admin-dashboard__email {
  margin: 8px 0 0;
  max-width: 220px;
  overflow: hidden;
  font-size: 12px;
  color: var(--admin-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-dashboard__section {
  margin-top: 28px;
}

.admin-dashboard__section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.admin-dashboard__section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.admin-dashboard__section-desc {
  margin: 0;
  font-size: 12px;
  color: var(--admin-text-muted);
}

.admin-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 1024px) {
  .admin-dashboard__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .admin-dashboard__hero {
    flex-direction: column;
  }

  .admin-dashboard__profile {
    text-align: left;
  }

  .admin-dashboard__grid {
    grid-template-columns: 1fr;
  }
}

.admin-dashboard__card {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 148px;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  padding: 16px 16px 18px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-surface);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.admin-dashboard__card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.admin-dashboard__card:focus-visible {
  outline: 2px solid var(--admin-accent);
  outline-offset: 2px;
}

.admin-dashboard__card-top {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.admin-dashboard__tag {
  display: inline-flex;
  height: 22px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: var(--admin-text-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.admin-dashboard__arrow {
  color: var(--admin-text-muted);
  font-size: 16px;
  transition:
    transform 0.15s ease,
    color 0.15s ease;
}

.admin-dashboard__card:hover .admin-dashboard__arrow {
  color: var(--admin-accent);
  transform: translateX(2px);
}

.admin-dashboard__card-title {
  margin: 12px 0 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--admin-text);
}

.admin-dashboard__card-desc {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--admin-text-secondary);
}

.admin-dashboard__accent {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 72px;
  height: 72px;
  border-radius: 999px 0 0 0;
  opacity: 0.14;
  pointer-events: none;
}

.admin-dashboard__accent--indigo {
  background: #6366f1;
}

.admin-dashboard__accent--violet {
  background: #8b5cf6;
}

.admin-dashboard__accent--sky {
  background: #0ea5e9;
}

.admin-dashboard__accent--amber {
  background: #f59e0b;
}

.admin-dashboard__accent--emerald {
  background: #10b981;
}

.admin-dashboard__accent--green {
  background: #008000;
}

.admin-dashboard__notes {
  margin-top: 24px;
}

.admin-dashboard__notes-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--admin-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.admin-dashboard__notes-list li + li {
  margin-top: 6px;
}
</style>
