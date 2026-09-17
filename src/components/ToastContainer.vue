<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <div
      v-for="t in items"
      :key="t.id"
      class="pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg border animate-fade-in"
      :class="typeClass(t.type)"
    >
      {{ t.message }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { toast } from '../utils/toast'

const items = ref([])
let unsubscribe = null

function typeClass(type) {
  if (type === 'success') return 'bg-green-50 text-green-800 border-green-200'
  if (type === 'error') return 'bg-red-50 text-red-800 border-red-200'
  if (type === 'warning') return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-slate-50 text-slate-800 border-slate-200'
}

onMounted(() => {
  unsubscribe = toast.subscribe((payload) => {
    items.value = [...items.value, payload]
    setTimeout(() => {
      items.value = items.value.filter((x) => x.id !== payload.id)
    }, payload.duration || 3000)
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>
