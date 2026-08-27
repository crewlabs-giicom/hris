<script setup lang="ts">
import type { NavGroupConfig } from '~/config/navigation'

defineProps<{ group: NavGroupConfig; collapsed: boolean }>()
</script>

<template>
  <div class="mb-3.5">
    <div
      v-if="!collapsed"
      class="text-[10.5px] tracking-wide font-bold text-[#6D7185] px-2.5 pt-1.5 pb-1"
    >
      {{ group.label }}
    </div>
    <template v-for="item in group.items" :key="item.label">
      <LayoutNavParentItem v-if="item.children" :item="item" :collapsed="collapsed" />
      <LayoutNavItem v-else :item="item" :collapsed="collapsed" />
    </template>
  </div>
</template>
