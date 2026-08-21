<script setup>
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
/** 로그인 ↔ 앱 사이만 fade-out-in (탭 전환 KeepAlive는 유지) */
const pageTransition = ref('')

router.beforeEach((to, from) => {
  pageTransition.value = to.name === 'login' || from.name === 'login' ? 'auth-page' : ''
})

const viewKey = (route) => (route.name === 'login' ? 'login' : 'app')
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="pageTransition" mode="out-in">
      <component :is="Component" :key="viewKey(route)" />
    </Transition>
  </RouterView>
</template>
