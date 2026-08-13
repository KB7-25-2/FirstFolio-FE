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
      path: '/onboarding/intro',
      name: 'onboarding-intro',
      component: () => import('@/views/onboarding/OnboardingIntroView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/onboarding/quiz',
      name: 'onboarding-quiz',
      component: () => import('@/views/onboarding/OnboardingQuizView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/onboarding/result',
      name: 'onboarding-result',
      component: () => import('@/views/onboarding/OnboardingResultView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/onboarding/curriculum',
      name: 'onboarding-curriculum',
      component: () => import('@/views/onboarding/OnboardingCurriculumView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/onboarding/curriculum-confirm',
      name: 'onboarding-curriculum-confirm',
      component: () => import('@/views/onboarding/OnboardingCurriculumConfirmView.vue'),
      meta: { requiresAuth: true, onboarding: true, hideNavbar: true },
    },
    {
      path: '/onboarding/diagnosis',
      redirect: { name: 'onboarding-intro' },
    },
    {
      path: '/onboarding',
      redirect: { name: 'onboarding-intro' },
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
          meta: { navTab: 'home' },
        },
        {
          path: 'daily',
          name: 'daily',
          component: () => import('@/views/DailyView.vue'),
          meta: { navTab: 'daily' },
        },
        {
          path: 'daily-quest',
          name: 'daily-quest',
          component: () => import('@/views/DailyQuestView.vue'),
          meta: { hideNavbar: true },
        },
        {
          path: 'leaderboard',
          redirect: { name: 'daily-quest' },
        },
        {
          path: 'daily-quest',
          name: 'daily-quest',
          component: () => import('@/views/DailyQuestView.vue'),
          meta: { hideNavbar: true },
        },
        {
          path: 'leaderboard',
          redirect: { name: 'daily-quest' },
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
              redirect: (to) => ({
                name: 'learning',
                query: { mainChapterId: String(to.params.mainChapterId) },
              }),
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
            {
              path: 'history',
              name: 'portfolio-history',
              component: () => import('@/views/portfolio/TransactionHistoryView.vue'),
              meta: {
                title: '거래 내역',
                subtitle: '매수·매도·이자·만기 등 자산 이벤트 이력을 확인하세요',
                navTab: 'portfolios',
              },
            },
          ],
        },
        {
          path: 'point-market',
          name: 'point-market',
          component: () => import('@/views/PointMarketView.vue'),
          meta: { navTab: 'point-market' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

setupAuthGuard(router)

export default router
