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
          name: 'portfolios',
          component: () => import('@/views/PortfoliosView.vue'),
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
