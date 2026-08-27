<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Edit, Trash2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  showTo?: string
  editTo?: string
  showAction?: boolean
  editAction?: boolean
  deleteAction?: boolean
}>(), {
  showAction: undefined,
  editAction: true,
  deleteAction: true
})

const emit = defineEmits<{
  show: []
  edit: []
  delete: []
}>()

const hasShow = computed(() => props.showAction === true || !!props.showTo)
const hasEdit = computed(() => props.editAction !== false)
const hasDelete = computed(() => props.deleteAction !== false)

function handleShow() {
  if (props.showTo) {
    navigateTo(props.showTo)
  } else {
    emit('show')
  }
}

function handleEdit() {
  if (props.editTo) {
    navigateTo(props.editTo)
  } else {
    emit('edit')
  }
}

function handleDelete() {
  emit('delete')
}
</script>

<template>
  <div class="py-1">
    <!-- Show Action -->
    <button
      v-if="hasShow"
      type="button"
      class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
      @click="handleShow"
    >
      <Eye class="w-3.5 h-3.5 text-blue-500" />
      <span>Detail</span>
    </button>

    <!-- Edit Action -->
    <button
      v-if="hasEdit"
      type="button"
      class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
      @click="handleEdit"
    >
      <Edit class="w-3.5 h-3.5 text-emerald-500" />
      <span>Edit</span>
    </button>

    <!-- Slot for Custom Actions (like Print or Inactive) -->
    <slot />

    <!-- Delete Action (Rendered at bottom, separated by top border if other actions exist) -->
    <button
      v-if="hasDelete"
      type="button"
      class="w-full text-left px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50/50 flex items-center gap-2 font-medium transition-colors border-t border-line mt-1 pt-1.5"
      @click="handleDelete"
    >
      <Trash2 class="w-3.5 h-3.5 text-red-500" />
      <span>Hapus</span>
    </button>
  </div>
</template>
