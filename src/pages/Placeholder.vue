<template>
  <div class="surface space-y-3 animate-fade-in">
    <h1 class="text-xl font-semibold" style="color: var(--color-text-primary)">{{ title }}</h1>
    <p class="text-sm" style="color: var(--color-text-secondary)">
      该页面尚未从 React 前端迁移。路由已预留，便于后续逐模块搬迁。
    </p>
    <p class="text-xs" style="color: var(--color-text-tertiary)">当前路径：{{ route.path }}</p>
    <RouterLink to="/home" class="btn btn-outline inline-flex">返回首页</RouterLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title || '待迁移页面')
</script>
