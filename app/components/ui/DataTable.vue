<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, useSlots } from 'vue'
import { useVueTable, getCoreRowModel, FlexRender, type ColumnDef, type SortingState } from '@tanstack/vue-table'
import { MoreVertical } from 'lucide-vue-next'

export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  /** Enables click-to-sort on this column's header (server-driven — see useDataTable). */
  sortable?: boolean
}

const props = defineProps<{
  columns: DataTableColumn[]
  rows: Record<string, any>[]
  /** Current sort state — omit entirely for a plain, unsorted table (e.g. static demo data). */
  sorting?: SortingState
}>()

const emit = defineEmits<{ 'update:sorting': [SortingState] }>()

const slots = useSlots()
const hasRowActions = computed(() => !!slots['row-actions'])

const columnDefs = computed<ColumnDef<Record<string, any>>[]>(() =>
  props.columns.map((col) => ({
    id: col.key,
    accessorKey: col.key,
    header: col.label,
    enableSorting: !!col.sortable,
    meta: { align: col.align },
  }))
)

const table = useVueTable({
  get data() {
    return props.rows
  },
  get columns() {
    return columnDefs.value
  },
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
  state: {
    get sorting() {
      return props.sorting ?? []
    },
  },
  onSortingChange: (updaterOrValue) => {
    const current = props.sorting ?? []
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue
    emit('update:sorting', next)
  },
})

// Row-actions dropdown — global to every DataTable, no per-page wiring required.
// Teleported to <body> and positioned `fixed` from the trigger's rect so it's never
// clipped by the table's overflow-x-auto wrapper or the card's overflow-hidden.
const openIndex = ref<number | null>(null)
const menuPosition = ref({ top: 0, left: 0 })
let menuEl: HTMLElement | null = null

function setMenuRef(el: unknown) {
  menuEl = (el as HTMLElement) ?? null
}

function toggleMenu(i: number, event: MouseEvent) {
  if (openIndex.value === i) {
    openIndex.value = null
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  menuPosition.value = { top: rect.bottom + 4, left: rect.left }
  openIndex.value = i
}

function handleDocClick(e: MouseEvent) {
  if (openIndex.value === null) return
  if (menuEl && !menuEl.contains(e.target as Node)) {
    openIndex.value = null
  }
}

function closeOnScroll() {
  openIndex.value = null
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  window.addEventListener('scroll', closeOnScroll, true)
  window.addEventListener('resize', closeOnScroll)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
  window.removeEventListener('scroll', closeOnScroll, true)
  window.removeEventListener('resize', closeOnScroll)
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-xs">
      <thead>
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="bg-[#FAFAFA] text-left text-ink-soft"
        >
          <th v-if="hasRowActions" class="w-10 px-2 py-2 border-t border-b border-line" />
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="font-semibold px-4 py-2 border-t border-b border-line"
            :class="[
              (header.column.columnDef.meta as any)?.align === 'right' ? 'text-right' : '',
              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-ink' : '',
            ]"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
            <span v-if="header.column.getIsSorted()" class="text-[9px] ml-1">
              {{ header.column.getIsSorted() === 'desc' ? '▼' : '▲' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="hover:bg-[#FAFAFA] [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-line"
        >
          <td v-if="hasRowActions" class="px-2 py-2 relative">
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-md text-ink-soft hover:bg-[#F0F0F0] hover:text-ink"
              @click.stop="toggleMenu(i, $event)"
            >
              <MoreVertical class="w-4 h-4" />
            </button>
            <Teleport to="body">
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="openIndex === i"
                  :ref="setMenuRef"
                  class="fixed min-w-[150px] bg-white border border-line rounded-lg shadow-lg py-1 z-50"
                  :style="{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }"
                  @click="openIndex = null"
                >
                  <slot name="row-actions" :row="row" />
                </div>
              </Transition>
            </Teleport>
          </td>
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-2"
            :class="col.align === 'right' ? 'text-right text-ink-soft' : ''"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
