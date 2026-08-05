import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuard } from '@/router/guards.js'
import AppLayout from '@/components/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/onboarding/diagnosis',
      name: 'onboarding-diagnosis',
      component: () => import('@/views/onboarding/LevelTestDiagnosisView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'learning',
          component: () => import('@/views/learning/LearningShellView.vue'),
          meta: { navTab: 'learning' },
          children: [
            {
              path: '',
              name: 'learning',
              component: () => import('@/views/learning/LearningRoadmapView.vue'),
            },
            {
              path: 'main-chapters/:mainChapterId',
              name: 'learning-main-chapter',
              component: () => import('@/views/learning/SubChapterSelectView.vue'),
            },
            {
              path: 'sub-chapters/:subChapterId',
              name: 'learning-lesson',
              component: () => import('@/views/learning/LessonPlayerView.vue'),
              meta: { hideNavbar: true },
            },
            {
              path: 'sub-chapters/:subChapterId/quiz',
              name: 'learning-quiz',
              component: () => import('@/views/learning/SubChapterQuizView.vue'),
              meta: { hideNavbar: true },
            },
            {
              path: 'main-chapters/:mainChapterId/scenario-quiz',
              name: 'learning-scenario-quiz',
              component: () => import('@/views/learning/MainChapterScenarioQuizView.vue'),
              meta: { hideNavbar: true },
            },
          ],
        },
        {
          path: 'portfolios',
          component: () => import('@/views/PortfoliosView.vue'),
          redirect: { name: 'portfolio-holdings' },
          children: [
            {
              path: 'holdings',
              name: 'portfolio-holdings',
              component: () => import('@/views/portfolio/CurrentAssetsView.vue'),
              meta: {
                title: '포트폴리오',
                subtitle: '보유 자산 · 교육용 만기/이자 주기를 확인하세요',
                showBankruptcyAction: true,
                navTab: 'portfolios',
              },
            },
            {
              path: 'purchase',
              name: 'portfolio-purchase',
              component: () => import('@/views/portfolio/ProductPurchaseView.vue'),
              meta: {
                title: '상품 구매',
                subtitle: '모의 상품을 둘러보고 포트폴리오에 담아보세요',
                navTab: 'portfolios',
              },
            },
            {
              path: 'time-compression',
              name: 'portfolio-time-compression',
              component: () => import('@/views/portfolio/TimeCompressionView.vue'),
              meta: {
                title: '시간 압축',
                subtitle: '교육용 시간과 실제 상품 주기를 함께 비교해요',
                navTab: 'portfolios',
              },
            },
          ],
        },
        {
          path: 'point-market',
          name: 'point-market',
          component: () => import('@/views/PointMarketView.vue'),
        },
      ],
    },
  ],
})

setupAuthGuard(router)

export default router
