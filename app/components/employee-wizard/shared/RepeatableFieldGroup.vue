<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Generic add/remove list editor for wizard array-steps (education, family, ...).
 * Parent supplies `newItem()` to create a blank row and renders each row via the
 * `item` scoped slot — this component only owns the array add/remove mechanics.
 */
const props = defineProps<{
  modelValue: T[]
  newItem: () => T
  addLabel: string
  emptyText?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [T[]] }>()

function add() {
  emit('update:modelValue', [...props.modelValue, props.newItem()])
}

function remove(index: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index)
  )
}

function updateItem(index: number, item: T) {
  const next = [...props.modelValue]
  next[index] = item
  emit('update:modelValue', next)
}
</script>

<template>
  <div>
    <TransitionGroup
      tag="div"
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-for="(item, index) in modelValue" :key="index" class="relative border border-line rounded-lg p-3.5 mb-3 bg-[#FBFBFC]">
        <button
          type="button"
          class="absolute top-2.5 right-2.5 text-ink-soft hover:text-red-600 text-xs"
          @click="remove(index)"
        >
          &#10005;
        </button>
        <slot name="item" :item="item" :index="index" :update="(next: T) => updateItem(index, next)" />
      </div>
    </TransitionGroup>

    <p v-if="!modelValue.length && emptyText" class="text-[11.5px] text-ink-soft mb-3">{{ emptyText }}</p>

    <UiButton type="button" variant="secondary" @click="add">{{ addLabel }}</UiButton>
  </div>
</template>
