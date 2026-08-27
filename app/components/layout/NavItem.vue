<script setup lang="ts">
import * as icons from 'lucide-vue-next'
import type { NavItemConfig } from '~/config/navigation'

const props = defineProps<{ item: NavItemConfig; collapsed: boolean }>()

const route = useRoute()
const isActive = computed(() => !!props.item.to && route.path === props.item.to)
const iconComp = computed(() => (icons as Record<string, any>)[props.item.icon])
</script>

<template>
  <NuxtLink
    :to="item.to"
    :title="collapsed ? item.label : undefined"
    class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sidebar-text text-xs font-medium hover:bg-[#1D2231] hover:text-white"
    :class="[isActive ? 'bg-topbar-1 text-white' : '', collapsed ? 'justify-center' : '']"
  >
    <component :is="iconComp" v-if="iconComp" class="w-3.5 h-3.5 shrink-0" />
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
    </Transition>
  </NuxtLink>
</template>
