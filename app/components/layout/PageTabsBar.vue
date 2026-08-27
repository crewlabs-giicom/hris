<script setup lang="ts">
import * as icons from 'lucide-vue-next'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const tabsStore = usePageTabsStore()
const scrollEl = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function iconFor(name: string) {
  return (icons as Record<string, any>)[name]
}

function updateScrollState() {
  const el = scrollEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollBy(amount: number) {
  scrollEl.value?.scrollBy({ left: amount, behavior: 'smooth' })
}

function onSelect(tab: { path: string; fullPath: string }) {
  if (!tabsStore.isActive(tab.path)) navigateTo(tab.fullPath)
}

function onClose(path: string) {
  const fallback = tabsStore.closeTab(path)
  if (fallback) navigateTo(fallback)
}

function onMiddleClick(e: MouseEvent, path: string) {
  if (e.button === 1) {
    e.preventDefault()
    onClose(path)
  }
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  updateScrollState()
  if (scrollEl.value) {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(scrollEl.value)
  }
})
onUnmounted(() => resizeObserver?.disconnect())
watch(() => tabsStore.tabs.length, () => nextTick(updateScrollState))
</script>

<template>
  <div class="sticky top-0 z-10 flex items-center bg-white border-b border-line h-9 shrink-0">
    <button
      v-if="canScrollLeft"
      type="button"
      class="shrink-0 h-full px-1 flex items-center text-ink-soft hover:text-ink hover:bg-[#FAFAFA]"
      @click="scrollBy(-160)"
    >
      <ChevronLeft class="w-3.5 h-3.5" />
    </button>

    <div ref="scrollEl" class="flex-1 flex overflow-x-auto scrollbar-hide" @scroll="updateScrollState">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        class="group flex items-center gap-1.5 px-3 h-9 border-r border-line text-[11.5px] cursor-pointer shrink-0 whitespace-nowrap"
        :class="
          tabsStore.isActive(tab.path)
            ? 'bg-canvas text-ink font-semibold border-b-2 border-b-topbar-1 -mb-px'
            : 'text-ink-soft hover:bg-[#FAFAFA]'
        "
        @click="onSelect(tab)"
        @mousedown.middle="onMiddleClick($event, tab.path)"
      >
        <component :is="iconFor(tab.icon)" v-if="iconFor(tab.icon)" class="w-3 h-3 shrink-0" />
        <span>{{ tab.title }}</span>
        <button
          v-if="tab.path !== '/'"
          type="button"
          class="shrink-0 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#E5E5E5]"
          :class="{ 'opacity-100': tabsStore.isActive(tab.path) }"
          @click.stop="onClose(tab.path)"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>

    <button
      v-if="canScrollRight"
      type="button"
      class="shrink-0 h-full px-1 flex items-center text-ink-soft hover:text-ink hover:bg-[#FAFAFA]"
      @click="scrollBy(160)"
    >
      <ChevronRight class="w-3.5 h-3.5" />
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  scrollbar-width: none;
}
</style>
