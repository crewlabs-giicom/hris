<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <label class="flex items-center gap-1.5 text-[11.5px] text-ink cursor-pointer select-none">
    <input
      type="checkbox"
      :checked="modelValue"
      class="w-3.5 h-3.5 rounded-md border-line text-topbar-1 focus:ring-0 focus:ring-offset-0"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    {{ label }}
  </label>
</template>
