<script setup lang="ts">
import type { SelectSearchOption } from '~/composables/useSelectSearchOptions'

/**
 * Searchable select, single or multi. Trigger looks like a normal input; clicking it opens a
 * Teleported dropdown positioned from the trigger's bounding rect — same technique DataTable.vue
 * already uses for its row-actions menu, so no new positioning dependency is needed.
 *
 * Pass either `endpoint` (server-backed, search-as-you-type) or `options` (fixed local list —
 * e.g. gender, blood type, marital status) — every select in the app uses this one component
 * so the search UX is consistent whether or not there's a backing table.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | undefined
    multiple?: boolean
    endpoint?: string
    /** Fixed local options — plain strings (used as both id and label) or {id,label} pairs. */
    options?: string[] | SelectSearchOption[]
    labelKey?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { multiple: false, labelKey: 'name', placeholder: '— Pilih —', disabled: false }
)
const emit = defineEmits<{ 'update:modelValue': [string | string[]] }>()

const staticOptions = computed<SelectSearchOption[] | undefined>(() => {
  if (!props.options) return undefined
  return props.options.map((o) => (typeof o === 'string' ? { id: o, label: o } : o))
})

const { search, options, loading, labelCache, fetchOptions, resolveLabels } = useSelectSearchOptions(
  staticOptions.value ?? props.endpoint ?? '',
  props.labelKey
)

const selectedIds = computed<string[]>(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue ? [props.modelValue as string] : []
})

watch(selectedIds, (ids) => resolveLabels(ids), { immediate: true })

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px', width: '0px' })

function openDropdown() {
  if (props.disabled) return
  const rect = triggerRef.value!.getBoundingClientRect()
  const margin = 8
  // Below `min-width`, options wrap/truncate unreadably on a narrow trigger (e.g. inside a
  // 1-column mobile form field) — and near the right edge, a naive `left: rect.left` would push
  // the menu (sized off the trigger's own width) past the viewport, clipped by nothing since
  // it's Teleported to body.
  const width = Math.max(rect.width, 220)
  const left = Math.min(rect.left, window.innerWidth - width - margin)
  menuStyle.value = { top: `${rect.bottom + 4}px`, left: `${Math.max(margin, left)}px`, width: `${width}px` }
  open.value = true
  search.value = ''
  fetchOptions()
  nextTick(() => searchInputRef.value?.focus())
}

function closeDropdown() {
  open.value = false
}

function toggleDropdown() {
  open.value ? closeDropdown() : openDropdown()
}

function selectOption(id: string) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', id)
    closeDropdown()
  }
}

function removeChip(id: string) {
  const current = Array.isArray(props.modelValue) ? props.modelValue : []
  emit('update:modelValue', current.filter((v) => v !== id))
}

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function handleDocClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (triggerRef.value?.contains(target)) return
  if (menuRef.value?.contains(target)) return
  closeDropdown()
}

function handleScroll(e: Event) {
  if (!open.value) return
  const target = e.target as HTMLElement
  if (menuRef.value?.contains(target)) return
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <div ref="triggerRef" class="relative">
    <div
      class="w-full min-h-[36px] text-[13px] px-3 py-1.5 border border-line rounded-lg bg-white text-ink flex flex-wrap items-center gap-1 cursor-pointer"
      :class="disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-topbar-1'"
      @click="toggleDropdown"
    >
      <template v-if="multiple">
        <span
          v-for="id in selectedIds"
          :key="id"
          class="inline-flex items-center gap-1 bg-[#FFF3EE] text-topbar-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        >
          {{ labelCache[id] ?? id }}
          <button type="button" class="leading-none" @click.stop="removeChip(id)">&#10005;</button>
        </span>
        <span v-if="!selectedIds.length" class="text-ink-soft">{{ placeholder }}</span>
      </template>
      <template v-else>
        <span v-if="selectedIds.length" class="truncate">{{ labelCache[selectedIds[0]] ?? selectedIds[0] }}</span>
        <span v-else class="text-ink-soft">{{ placeholder }}</span>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="fixed z-50 bg-white border border-line rounded-lg shadow-lg overflow-hidden"
        :style="menuStyle"
      >
        <input
          ref="searchInputRef"
          v-model="search"
          placeholder="Cari..."
          class="w-full text-[12.5px] px-3 py-2 border-b border-line outline-none"
          @click.stop
        />
        <div class="max-h-[220px] overflow-y-auto py-1">
          <div v-if="loading" class="px-3 py-2 text-[11.5px] text-ink-soft">Memuat...</div>
          <button
            v-if="!multiple && !loading"
            type="button"
            class="w-full text-left px-3 py-1.5 text-[12.5px] text-ink-soft hover:bg-[#FAFAFA] border-b border-line"
            @click="selectOption('')"
          >
            — Clear Selection —
          </button>
          <div v-else-if="!options.length" class="px-3 py-2 text-[11.5px] text-ink-soft">Tidak ada hasil</div>
          <button
            v-for="opt in options"
            :key="opt.id"
            type="button"
            class="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[12.5px] hover:bg-[#FAFAFA]"
            :class="isSelected(opt.id) ? 'text-topbar-1 font-semibold' : 'text-ink'"
            @click="selectOption(opt.id)"
          >
            <span
              v-if="multiple"
              class="w-3.5 h-3.5 border border-line rounded flex items-center justify-center shrink-0"
              :class="isSelected(opt.id) ? 'bg-topbar-1 border-topbar-1 text-white' : ''"
            >
              <span v-if="isSelected(opt.id)" class="text-[9px]">&#10003;</span>
            </span>
            {{ opt.label }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
