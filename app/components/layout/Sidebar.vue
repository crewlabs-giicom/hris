<script setup lang="ts">
import { navigation } from '~/config/navigation'

const props = defineProps<{ collapsed: boolean; mobileOpen: boolean }>()
const emit = defineEmits<{ 'close-mobile': [] }>()

const route = useRoute()
watch(() => route.fullPath, () => emit('close-mobile'))

// The icon-only rail only makes sense as a permanent, always-visible desktop sidebar — as a
// mobile overlay drawer it should always show full labels regardless of the desktop collapse
// state, otherwise a user who left the desktop sidebar collapsed gets an unusable icon-only drawer.
const effectiveCollapsed = computed(() => props.collapsed && !props.mobileOpen)
</script>

<template>
  <div v-if="mobileOpen" class="fixed inset-0 bg-black/40 z-40 lg:hidden" @click="emit('close-mobile')" />

  <aside
    class="bg-sidebar overflow-y-auto overflow-x-hidden py-2 px-2 pb-4 rounded-r-card z-50 fixed inset-y-0 left-0 w-sidebar transition-transform duration-200 lg:static lg:shrink-0 lg:transition-[width] lg:duration-150 lg:translate-x-0"
    :class="[mobileOpen ? 'translate-x-0' : '-translate-x-full', collapsed ? 'lg:w-[56px]' : 'lg:w-sidebar']"
  >
    <LayoutNavGroup v-for="group in navigation" :key="group.label" :group="group" :collapsed="effectiveCollapsed" />
  </aside>
</template>
