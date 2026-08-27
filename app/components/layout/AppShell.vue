<script setup lang="ts">
const { collapsed, mobileOpen, toggle, closeMobile } = useSidebar()
const tabsStore = usePageTabsStore()
const route = useRoute()

// hydrate from localStorage before the immediate watch below adds the current route,
// so a freshly-restored tab list isn't clobbered by the just-opened tab (or vice versa)
tabsStore.hydrate()
watch(
  () => route.fullPath,
  () => tabsStore.openTab(route.path, route.fullPath),
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <LayoutTopBar :collapsed="collapsed" @toggle-sidebar="toggle" />
    <div class="flex-1 flex min-h-0">
      <LayoutSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @close-mobile="closeMobile" />
      <div class="flex-1 flex flex-col min-w-0">
        <LayoutPageTabsBar />
        <main
          class="flex-1 overflow-y-auto p-4 bg-cover bg-center bg-no-repeat bg-fixed"
          style="background-image: url('/images/bg-desktop.jpg');"
        >
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
