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
          name: 'learning',
          component: () => import('@/views/LearningView.vue'),
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
