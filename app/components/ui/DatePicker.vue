<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string | undefined
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Pilih Tanggal...', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px', width: '280px' })

// View modes: 'days' (calendar), 'months' (grid), 'years' (grid)
const viewMode = ref<'days' | 'months' | 'years'>('days')

// Current year & month being viewed in the calendar
const viewMonth = ref(new Date().getMonth())
const viewYear = ref(new Date().getFullYear())

// Pivot year for year selection grid
const yearPivot = ref(new Date().getFullYear())

const monthsList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Parsed date from model value
const selectedDateObj = computed(() => {
  if (!props.modelValue) return null
  const parts = props.modelValue.split('-')
  if (parts.length !== 3) return null
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
})

// Text displayed in the trigger input field
const displayText = computed(() => {
  const dateObj = selectedDateObj.value
  if (!dateObj) return ''
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = monthsList[dateObj.getMonth()]
  const year = dateObj.getFullYear()
  return `${day} ${month} ${year}`
})

// Calculate dropdown menu coordinates dynamically to prevent clipping
function openDropdown() {
  if (props.disabled) return
  const rect = triggerRef.value!.getBoundingClientRect()
  const margin = 8
  const width = 280
  const dropdownHeight = 310 // estimated height of dropdown menu
  
  const left = Math.min(rect.left, window.innerWidth - width - margin)
  
  // Calculate if we should open above or below trigger
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  
  let top = rect.bottom + 4
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    top = rect.top - dropdownHeight - 4
  }
  
  menuStyle.value = {
    top: `${top}px`,
    left: `${Math.max(margin, left)}px`,
    width: `${width}px`
  }
  
  isOpen.value = true
  viewMode.value = 'days'
}

function closeDropdown() {
  isOpen.value = false
}

function toggleDropdown() {
  isOpen.value ? closeDropdown() : openDropdown()
}

// Watch modelValue to update views accordingly
watch(isOpen, (open) => {
  if (open) {
    const dateObj = selectedDateObj.value || new Date()
    viewMonth.value = dateObj.getMonth()
    viewYear.value = dateObj.getFullYear()
  }
})

// When entering years mode, initialize the yearPivot to the currently viewed year
watch(viewMode, (mode) => {
  if (mode === 'years') {
    yearPivot.value = viewYear.value
  }
})

// Generate list of 12 years for the year selection grid
const yearsGridList = computed(() => {
  const pivot = yearPivot.value
  const list = []
  for (let i = pivot - 5; i <= pivot + 6; i++) {
    list.push(i)
  }
  return list
})

// Helper calculations for calendar grid
const daysGrid = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const grid = []

  // Fill previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    grid.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    })
  }

  // Fill current month days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    })
  }

  // Fill next month padding to make exactly 6 rows (42 cells)
  const totalCells = 42
  const nextMonthPadding = totalCells - grid.length
  for (let i = 1; i <= nextMonthPadding; i++) {
    grid.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    })
  }

  return grid
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function prevYearPage() {
  yearPivot.value -= 12
}

function nextYearPage() {
  yearPivot.value += 12
}

type CellItem = { day: number; month: number; year: number }

function selectDay(cell: CellItem) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${cell.year}-${pad(cell.month + 1)}-${cell.day}`
  emit('update:modelValue', dateStr)
  closeDropdown()
}

function selectMonth(monthIdx: number) {
  viewMonth.value = monthIdx
  viewMode.value = 'days'
}

function selectYear(yearNum: number) {
  viewYear.value = yearNum
  viewMode.value = 'days'
}

function selectToday() {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  emit('update:modelValue', dateStr)
  closeDropdown()
}

function clearValue() {
  emit('update:modelValue', '')
  closeDropdown()
}

function isSelected(cell: CellItem) {
  const selected = selectedDateObj.value
  if (!selected) return false
  return selected.getDate() === cell.day &&
         selected.getMonth() === cell.month &&
         selected.getFullYear() === cell.year
}

function isToday(cell: CellItem) {
  const today = new Date()
  return today.getDate() === cell.day &&
         today.getMonth() === cell.month &&
         today.getFullYear() === cell.year
}

// Click outside handling
function handleClickOutside(event: MouseEvent) {
  if (!isOpen.value) return
  const target = event.target as Node
  
  // If the target is no longer in the document (e.g. unmounted during the click view transition),
  // ignore it to prevent premature closing of the dropdown.
  if (!document.body.contains(target)) return

  if (triggerRef.value?.contains(target)) return
  if (menuRef.value?.contains(target)) return
  closeDropdown()
}

function handleScroll(e: Event) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (menuRef.value?.contains(target)) return
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <div ref="triggerRef" class="relative w-full">
    <!-- Trigger input field -->
    <div
      class="w-full min-h-[36px] text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink flex items-center justify-between cursor-pointer hover:border-topbar-1"
      :class="disabled ? 'opacity-60 cursor-not-allowed' : ''"
      @click="toggleDropdown"
    >
      <div class="flex items-center gap-2.5">
        <CalendarIcon class="w-4 h-4 text-ink-soft shrink-0" />
        <span v-if="displayText" class="font-medium text-ink">{{ displayText }}</span>
        <span v-else class="text-ink-soft">{{ placeholder }}</span>
      </div>
      
      <!-- Clear icon -->
      <button
        v-if="modelValue && !disabled"
        type="button"
        class="text-ink-soft hover:text-ink p-0.5 rounded-full"
        @click.stop="clearValue"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Dropdown Calendar teleported to body to prevent container cut-offs -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-50 bg-white border border-line rounded-xl shadow-lg p-4 w-[280px] select-none"
        :style="menuStyle"
      >
        <!-- Mode: DAYS calendar grid view -->
        <template v-if="viewMode === 'days'">
          <!-- Header navigation -->
          <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
            <button
              type="button"
              class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
              title="Bulan Sebelumnya"
              @click="prevMonth"
            >
              <ChevronLeft class="w-4 h-4 text-ink-soft" />
            </button>

            <!-- Separated Month and Year controls -->
            <div class="flex items-center gap-1">
              <!-- Click Month to choose month -->
              <button
                type="button"
                class="text-xs font-bold text-ink hover:text-[#F08050] transition-colors uppercase tracking-wide px-1.5 py-0.5 rounded hover:bg-gray-50"
                title="Pilih Bulan"
                @click="viewMode = 'months'"
              >
                {{ monthsList[viewMonth] }}
              </button>
              
              <!-- Click Year to choose year -->
              <button
                type="button"
                class="text-xs font-bold text-ink hover:text-[#F08050] transition-colors uppercase tracking-wide px-1.5 py-0.5 rounded hover:bg-gray-50"
                title="Pilih Tahun"
                @click="viewMode = 'years'"
              >
                {{ viewYear }}
              </button>
            </div>

            <button
              type="button"
              class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
              title="Bulan Berikutnya"
              @click="nextMonth"
            >
              <ChevronRight class="w-4 h-4 text-ink-soft" />
            </button>
          </div>

          <!-- Weekdays header -->
          <div class="calendar-grid text-center mb-1.5">
            <span
              v-for="dayName in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"
              :key="dayName"
              class="text-[10px] font-bold text-ink-soft uppercase tracking-wider block"
            >
              {{ dayName }}
            </span>
          </div>

          <!-- Calendar Days Grid -->
          <div class="calendar-grid">
            <button
              v-for="(cell, idx) in daysGrid"
              :key="idx"
              type="button"
              class="aspect-square text-xs font-medium rounded-lg flex items-center justify-center transition-all outline-none"
              :class="[
                cell.isCurrentMonth ? 'text-ink' : 'text-ink-soft opacity-40',
                isSelected(cell)
                  ? 'bg-[#F08050] text-white font-bold shadow-sm'
                  : isToday(cell)
                    ? 'border border-[#F08050] text-[#F08050] font-bold'
                    : 'hover:bg-gray-100'
              ]"
              @click="selectDay(cell)"
            >
              {{ cell.day }}
            </button>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-between border-t border-line mt-3 pt-2.5">
            <button
              type="button"
              class="text-[11px] font-bold text-ink-soft hover:text-ink transition-colors uppercase tracking-wider"
              @click="clearValue"
            >
              Bersihkan
            </button>
            <button
              type="button"
              class="text-[11px] font-bold text-[#F08050] hover:text-[#E07040] transition-colors uppercase tracking-wider"
              @click="selectToday"
            >
              Hari Ini
            </button>
          </div>
        </template>

        <!-- Mode: MONTH selector grid view -->
        <template v-else-if="viewMode === 'months'">
          <!-- Header showing month view title -->
          <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
            <span class="text-xs font-bold text-ink tracking-wide px-1">
              PILIH BULAN ({{ viewYear }})
            </span>
            <span class="text-[10.5px] text-ink-soft">Klik untuk memilih</span>
          </div>

          <!-- 3x4 Month Grid Selector -->
          <div class="months-grid">
            <button
              v-for="(mName, idx) in monthsList"
              :key="idx"
              type="button"
              class="py-2.5 text-xs font-semibold rounded-lg text-center transition-colors animate-fade-in"
              :class="[
                viewMonth === idx
                  ? 'bg-[#F08050] text-white font-bold shadow-sm'
                  : 'text-ink hover:bg-gray-100'
              ]"
              @click="selectMonth(idx)"
            >
              {{ mName.slice(0, 3) }}
            </button>
          </div>

          <!-- Footer switch back to days grid -->
          <div class="flex items-center justify-center border-t border-line mt-3 pt-2.5">
            <button
              type="button"
              class="p-1.5 text-ink-soft hover:text-[#F08050] hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
              title="Lihat Kalender"
              @click="viewMode = 'days'"
            >
              <CalendarDays class="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </template>

        <!-- Mode: YEAR selector grid view -->
        <template v-else-if="viewMode === 'years'">
          <!-- Header (12-year page pagination) -->
          <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
            <button
              type="button"
              class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
              title="12 Tahun Sebelumnya"
              @click="prevYearPage"
            >
              <ChevronLeft class="w-4 h-4 text-ink-soft" />
            </button>

            <span class="text-xs font-bold text-ink tracking-wide">
              {{ yearPivot - 5 }} - {{ yearPivot + 6 }}
            </span>

            <button
              type="button"
              class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
              title="12 Tahun Berikutnya"
              @click="nextYearPage"
            >
              <ChevronRight class="w-4 h-4 text-ink-soft" />
            </button>
          </div>

          <!-- 3x4 Years Grid Selector -->
          <div class="months-grid">
            <button
              v-for="yNum in yearsGridList"
              :key="yNum"
              type="button"
              class="py-2.5 text-xs font-semibold rounded-lg text-center transition-colors"
              :class="[
                viewYear === yNum
                  ? 'bg-[#F08050] text-white font-bold shadow-sm'
                  : 'text-ink hover:bg-gray-100'
              ]"
              @click="selectYear(yNum)"
            >
              {{ yNum }}
            </button>
          </div>

          <!-- Footer switch back to days grid -->
          <div class="flex items-center justify-center border-t border-line mt-3 pt-2.5">
            <button
              type="button"
              class="p-1.5 text-ink-soft hover:text-[#F08050] hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
              title="Lihat Kalender"
              @click="viewMode = 'days'"
            >
              <CalendarDays class="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.calendar-grid {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
  gap: 4px !important;
}
.months-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 8px !important;
}
</style>
