<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string | number | boolean
}>()

const displayLabel = computed(() => {
  const val = props.status
  if (val === true || val === 1 || String(val).toLowerCase() === 'yes') return 'Yes'
  if (val === false || val === 0 || String(val).toLowerCase() === 'no') return 'No'
  return String(val)
})

const badgeClass = computed(() => {
  const s = String(props.status).toLowerCase().trim()
  
  if (s === 'active' || s === 'masuk') {
    return 'bg-blue-50 text-blue-600 border border-blue-200'
  }
  if (s === 'approved' || s === 'yes' || s === '1' || s === 'true' || s === 'fixed' || s === 'fix') {
    return 'bg-green-50 text-green-600 border border-green-200'
  }
  if (s === 'rejected' || s === 'no' || s === '0' || s === 'false' || s === 'off' || s === 'deleted') {
    return 'bg-red-50 text-red-600 border border-red-200'
  }
  if (s === 'pending') {
    return 'bg-yellow-50 text-yellow-600 border border-yellow-200'
  }
  
  return 'bg-gray-50 text-gray-600 border border-gray-200'
})
</script>

<template>
  <span
    class="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-block select-none capitalize"
    :class="badgeClass"
  >
    {{ displayLabel }}
  </span>
</template>
