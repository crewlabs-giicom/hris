<script setup lang="ts">
defineProps<{ variant: 'ok' | 'warn' | 'active' | 'inactive'; label: string }>()
</script>

<template>
  <span
    class="text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-block"
    :class="variant === 'ok' || variant === 'active' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'"
  >
    {{ label }}
  </span>
</template>
