<script setup lang="ts">
import { Menu, Search } from 'lucide-vue-next'
import { flattenNavigation } from '~/config/navigation'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ toggleSidebar: [] }>()

const allEntries = flattenNavigation()
const query = ref('')
const searchOpen = ref(false)
const searchEl = ref<HTMLElement | null>(null)
onClickOutside(searchEl, () => (searchOpen.value = false))

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return allEntries.filter((e) => e.label.toLowerCase().includes(q)).slice(0, 8)
})

function goTo(to: string) {
  query.value = ''
  searchOpen.value = false
  navigateTo(to)
}
</script>

<template>
  <header class="h-topbar shrink-0 flex items-center justify-between pr-4 rounded-b-card bg-gradient-to-r from-topbar-1 to-topbar-2">
    <div class="flex items-center gap-3 h-full">
      <div
        class="shrink-0 h-full flex items-center gap-2.5 px-4 transition-[width] duration-150"
        :class="collapsed ? 'w-[56px]' : 'w-[56px] lg:w-sidebar'"
      >
        <div class="w-[26px] h-[26px] rounded-md bg-white/20 flex items-center justify-center text-white font-extrabold text-sm">
          B
        </div>
      </div>
      <button type="button" class="text-white" aria-label="Toggle menu" @click="emit('toggleSidebar')">
        <Menu class="w-4 h-4" />
      </button>
      <span class="hidden sm:inline text-white font-bold text-[13px] tracking-wide">GII COMMERCE</span>
    </div>

    <div ref="searchEl" class="hidden md:block relative flex-1 max-w-sm mx-6">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/70" />
      <input
        v-model="query"
        type="text"
        placeholder="Cari menu..."
        class="w-full text-xs text-white placeholder-white/60 bg-white/15 focus:bg-white/25 rounded-md pl-8 pr-3 py-1.5 outline-none transition-colors"
        @focus="searchOpen = true"
      />
      <div
        v-if="searchOpen && results.length"
        class="absolute left-0 top-full mt-1.5 w-full rounded-md bg-white border border-line shadow-lg py-1 z-30 text-ink"
      >
        <button
          v-for="r in results"
          :key="r.to"
          type="button"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas"
          @click="goTo(r.to)"
        >
          {{ r.label }}
        </button>
      </div>
      <div
        v-else-if="searchOpen && query.trim()"
        class="absolute left-0 top-full mt-1.5 w-full rounded-md bg-white border border-line shadow-lg py-2 z-30 text-xs text-ink-soft text-center"
      >
        Tidak ada hasil
      </div>
    </div>

    <div class="flex items-center gap-4">
      <LayoutNotificationMenu />
      <LayoutUserMenu />
    </div>
  </header>
</template>
