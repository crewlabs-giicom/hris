<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import * as icons from 'lucide-vue-next'
import type { NavItemConfig } from '~/config/navigation'

const props = defineProps<{ item: NavItemConfig; collapsed: boolean }>()

const route = useRoute()
const isChildActive = computed(() => !!props.item.children?.some((c) => c.to === route.path))
const open = ref(isChildActive.value)
const iconComp = computed(() => (icons as Record<string, any>)[props.item.icon])
</script>

<template>
  <!-- collapsed: icon-only trigger, children shown as a hover flyout -->
  <div v-if="collapsed" class="relative group">
    <button
      type="button"
      :title="item.label"
      class="w-full flex items-center justify-center px-2.5 py-1.5 rounded-md text-white bg-[#1D2231] text-xs font-medium"
      :class="isChildActive ? 'bg-topbar-1' : ''"
    >
      <component :is="iconComp" v-if="iconComp" class="w-3.5 h-3.5" />
    </button>
    <div
      class="invisible opacity-0 scale-95 group-hover:visible group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top-left absolute left-full top-0 ml-1 min-w-[180px] rounded-lg bg-sidebar border border-[#2A2F42] shadow-lg py-1.5 z-20"
    >
      <div class="text-[10.5px] tracking-wide font-bold text-[#6D7185] px-3 pt-1 pb-1.5">
        {{ item.label }}
      </div>
      <NuxtLink
        v-for="child in item.children"
        :key="child.to"
        :to="child.to"
        class="block px-3 py-1.5 text-[11.5px] text-sidebar-text hover:bg-[#1D2231] hover:text-white"
        :class="route.path === child.to ? 'bg-topbar-1 text-white' : ''"
      >
        {{ child.label }}
      </NuxtLink>
    </div>
  </div>

  <!-- expanded: inline click-to-expand -->
  <div v-else>
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-white bg-[#1D2231] text-xs font-medium"
      @click="open = !open"
    >
      <span class="flex items-center gap-2">
        <component :is="iconComp" v-if="iconComp" class="w-3.5 h-3.5" />
        {{ item.label }}
      </span>
      <ChevronDown class="w-3 h-3 transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-show="open" class="pl-[30px] mt-0.5">
        <NuxtLink
          v-for="child in item.children"
          :key="child.to"
          :to="child.to"
          class="block px-2 py-1 rounded-md text-[11.5px] text-sidebar-text"
          :class="route.path === child.to ? 'bg-topbar-1 text-white' : ''"
        >
          {{ child.label }}
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
