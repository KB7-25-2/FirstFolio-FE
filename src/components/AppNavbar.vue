<script setup>
import { useNavTabs } from '@/composables/useNavTabs.js'

const { tabs, isActive, navigate } = useNavTabs()
</script>

<template>
  <nav
    class="nav-bar flex w-full shrink-0 items-start border-t border-[var(--nav-border)] bg-[var(--nav-bg)] pt-[1dvh]"
  >
    <button
      v-for="tab in tabs"
      :key="tab.name"
      type="button"
      class="relative flex flex-1 flex-col items-center justify-start"
      @click="navigate(tab.path)"
    >
      <!-- IconWrap -->
      <span
        class="nav-icon-wrap flex items-center justify-center transition-all"
        :class="isActive(tab.name) ? '-translate-y-[2px]' : ''"
      >
        <font-awesome-icon
          :icon="tab.icon"
          class="transition-all"
          :class="[
            isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]',
            isActive(tab.name) ? 'nav-icon-active' : 'nav-icon',
          ]"
        />
      </span>

      <!-- 레이블 -->
      <span
        class="nav-label mt-[0.3dvh] font-bold transition-colors"
        :class="isActive(tab.name) ? tab.activeClass : 'text-[var(--nav-text-muted)]'"
      >
        {{ tab.label }}
      </span>

      <!-- 활성 dot -->
      <!--      <span
        v-if="isActive(tab.name)"
        class="nav-dot absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        :class="tab.activeDotClass"
      /> -->
    </button>
  </nav>
</template>
