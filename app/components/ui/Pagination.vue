<script setup lang="ts">
withDefaults(defineProps<{ from: number; to: number; total: number; perPage?: number }>(), {
  perPage: undefined,
})
defineEmits<{ prev: []; next: []; 'update:perPage': [number] }>()

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2.5 text-[11.5px] text-ink-soft">
    <div class="flex items-center gap-3">
      <span>Showing {{ from }} to {{ to }} of {{ total }} entries</span>
      <label v-if="perPage !== undefined" class="flex items-center gap-1.5">
        Show
        <select
          :value="perPage"
          class="border border-line rounded-lg px-1.5 py-0.5 text-[11.5px] bg-white text-ink"
          @change="$emit('update:perPage', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
    </div>
    <div class="flex gap-1">
      <button type="button" class="border border-line rounded-lg px-2.5 py-1 text-[11px] bg-white text-ink" @click="$emit('prev')">
        Previous
      </button>
      <button type="button" class="border border-line rounded-lg px-2.5 py-1 text-[11px] bg-white text-ink" @click="$emit('next')">
        Next
      </button>
    </div>
  </div>
</template>
