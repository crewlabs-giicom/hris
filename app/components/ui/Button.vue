<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'secondary',
    loading: false,
    disabled: false,
    type: 'button',
  }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="text-[11.5px] font-semibold rounded-lg px-3.5 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    :class="{
      'bg-gradient-to-r from-topbar-1 to-topbar-2 text-white': variant === 'primary',
      'bg-white text-ink border border-line hover:bg-[#FAFAFA]': variant === 'secondary',
      'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
    }"
  >
    <slot>{{ loading ? 'Memproses...' : '' }}</slot>
  </button>
</template>
