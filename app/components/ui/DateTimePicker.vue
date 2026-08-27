<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, CalendarDays, Clock } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string | undefined
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Pilih Tanggal & Jam...', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px', width: '410px' })

const viewMonth = ref(new Date().getMonth())
const viewYear = ref(new Date().getFullYear())
const viewMode = ref<'days' | 'months' | 'years'>('days')
const yearPivot = ref(new Date().getFullYear())

const hourContainer = ref<HTMLElement | null>(null)
const minuteContainer = ref<HTMLElement | null>(null)

const monthsList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

// Selected internal states
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth())
const selectedDay = ref(new Date().getDate())
const selectedHour = ref('12')
const selectedMinute = ref('00')

// Parse modelValue e.g. "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM"
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      try {
        const cleanVal = val.replace('T', ' ')
        const parts = cleanVal.split(' ')
        
        // Parse date
        if (parts[0]) {
          const dParts = parts[0].split('-')
          if (dParts.length === 3) {
            selectedYear.value = Number(dParts[0])
            selectedMonth.value = Number(dParts[1]) - 1
            selectedDay.value = Number(dParts[2])
          }
        }
        
        // Parse time
        if (parts[1]) {
          const tParts = parts[1].split(':')
          selectedHour.value = tParts[0] || '12'
          selectedMinute.value = tParts[1] || '00'
        }
      } catch (e) {
        console.error('Failed to parse DateTime value:', val, e)
      }
    }
  },
  { immediate: true }
)

const hasValue = computed(() => !!props.modelValue)

const displayText = computed(() => {
  if (!props.modelValue) return ''
  const d = String(selectedDay.value).padStart(2, '0')
  const m = monthsList[selectedMonth.value]
  const y = selectedYear.value
  const hh = selectedHour.value
  const mm = selectedMinute.value
  return `${d} ${m} ${y} Pukul ${hh}:${mm}`
})

function openDropdown() {
  if (props.disabled) return
  const rect = triggerRef.value!.getBoundingClientRect()
  const margin = 8
  const width = 410
  const dropdownHeight = 310
  
  const left = Math.min(rect.left, window.innerWidth - width - margin)
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
  viewMonth.value = selectedMonth.value
  viewYear.value = selectedYear.value
  
  nextTick(() => {
    scrollToTimeSelected()
  })
}

function scrollToTimeSelected() {
  if (hourContainer.value) {
    const activeHourEl = hourContainer.value.querySelector('.bg-topbar-1') as HTMLElement
    if (activeHourEl) {
      hourContainer.value.scrollTop = activeHourEl.offsetTop - hourContainer.value.offsetHeight / 2 + activeHourEl.offsetHeight / 2
    }
  }
  if (minuteContainer.value) {
    const activeMinuteEl = minuteContainer.value.querySelector('.bg-topbar-1') as HTMLElement
    if (activeMinuteEl) {
      minuteContainer.value.scrollTop = activeMinuteEl.offsetTop - minuteContainer.value.offsetHeight / 2 + activeMinuteEl.offsetHeight / 2
    }
  }
}

function closeDropdown() {
  isOpen.value = false
}

function toggleDropdown() {
  isOpen.value ? closeDropdown() : openDropdown()
}

// Generate calendar days
const daysGrid = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const grid = []

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    grid.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    })
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    })
  }

  // Next month padding
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

const yearsGridList = computed(() => {
  const pivot = yearPivot.value
  const list = []
  for (let i = pivot - 5; i <= pivot + 6; i++) {
    list.push(i)
  }
  return list
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

function selectDay(cell: { day: number; month: number; year: number }) {
  selectedDay.value = cell.day
  selectedMonth.value = cell.month
  selectedYear.value = cell.year
  emitValue()
}

function selectHour(h: string) {
  selectedHour.value = h
  emitValue()
}

function selectMinute(m: string) {
  selectedMinute.value = m
  emitValue()
}

function emitValue() {
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${selectedYear.value}-${pad(selectedMonth.value + 1)}-${pad(selectedDay.value)}`
  const timeStr = `${selectedHour.value}:${selectedMinute.value}:00`
  emit('update:modelValue', `${dateStr} ${timeStr}`)
}

function selectToday() {
  const today = new Date()
  selectedDay.value = today.getDate()
  selectedMonth.value = today.getMonth()
  selectedYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
  viewYear.value = today.getFullYear()
  emitValue()
}

function clearValue() {
  emit('update:modelValue', '')
  closeDropdown()
}

function isSelected(cell: { day: number; month: number; year: number }) {
  return selectedDay.value === cell.day &&
         selectedMonth.value === cell.month &&
         selectedYear.value === cell.year
}

function isToday(cell: { day: number; month: number; year: number }) {
  const today = new Date()
  return today.getDate() === cell.day &&
         today.getMonth() === cell.month &&
         today.getFullYear() === cell.year
}

function handleClickOutside(event: MouseEvent) {
  if (!isOpen.value) return
  const target = event.target as Node
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
        <span v-if="hasValue" class="font-medium text-ink">{{ displayText }}</span>
        <span v-else class="text-ink-soft">{{ placeholder }}</span>
      </div>
      
      <!-- Clear icon -->
      <button
        v-if="hasValue && !disabled"
        type="button"
        class="text-ink-soft hover:text-ink p-0.5 rounded-full"
        @click.stop="clearValue"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Dropdown Teleported -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-50 bg-white border border-line rounded-xl shadow-lg p-4 select-none flex gap-4 w-[410px]"
        :style="menuStyle"
      >
        <!-- Calendar (Left Side) -->
        <div class="w-[250px] shrink-0 border-r border-line pr-4">
          <!-- Calendar Days Mode -->
          <template v-if="viewMode === 'days'">
            <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
              <button
                type="button"
                class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
                @click="prevMonth"
              >
                <ChevronLeft class="w-4 h-4 text-ink-soft" />
              </button>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="text-xs font-bold text-ink hover:text-[#F08050] transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-gray-50"
                  @click="viewMode = 'months'"
                >
                  {{ monthsList[viewMonth] }}
                </button>
                <button
                  type="button"
                  class="text-xs font-bold text-ink hover:text-[#F08050] transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-gray-50"
                  @click="viewMode = 'years'"
                >
                  {{ viewYear }}
                </button>
              </div>

              <button
                type="button"
                class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
                @click="nextMonth"
              >
                <ChevronRight class="w-4 h-4 text-ink-soft" />
              </button>
            </div>

            <!-- Weekdays -->
            <div class="calendar-grid text-center mb-1.5">
              <span
                v-for="d in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"
                :key="d"
                class="text-[9px] font-bold text-ink-soft uppercase tracking-wider block"
              >
                {{ d }}
              </span>
            </div>

            <!-- Grid days -->
            <div class="calendar-grid">
              <button
                v-for="(cell, idx) in daysGrid"
                :key="idx"
                type="button"
                class="aspect-square text-[11px] font-medium rounded-lg flex items-center justify-center transition-all outline-none"
                :class="[
                  cell.isCurrentMonth ? 'text-ink' : 'text-ink-soft opacity-30',
                  isSelected(cell)
                    ? 'bg-topbar-1 text-white font-bold shadow-sm'
                    : isToday(cell)
                      ? 'border border-topbar-1 text-topbar-1 font-bold'
                      : 'hover:bg-gray-100'
                ]"
                @click="selectDay(cell)"
              >
                {{ cell.day }}
              </button>
            </div>

            <!-- Calendar actions -->
            <div class="flex items-center justify-between border-t border-line mt-3 pt-2.5">
              <button
                type="button"
                class="text-[10px] font-bold text-ink-soft hover:text-ink transition-colors uppercase tracking-wider"
                @click="clearValue"
              >
                Bersihkan
              </button>
              <button
                type="button"
                class="text-[10px] font-bold text-topbar-1 hover:opacity-85 transition-colors uppercase tracking-wider"
                @click="selectToday"
              >
                Hari Ini
              </button>
            </div>
          </template>

          <!-- Months selector mode -->
          <template v-else-if="viewMode === 'months'">
            <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
              <span class="text-xs font-bold text-ink tracking-wide px-1">Pilih Bulan ({{ viewYear }})</span>
            </div>
            <div class="months-grid">
              <button
                v-for="(mName, idx) in monthsList"
                :key="idx"
                type="button"
                class="py-2 text-[11px] font-semibold rounded-lg text-center transition-colors"
                :class="[viewMonth === idx ? 'bg-topbar-1 text-white' : 'text-ink hover:bg-gray-100']"
                @click="viewMonth = idx; viewMode = 'days'"
              >
                {{ mName.slice(0, 3) }}
              </button>
            </div>
            <div class="flex items-center justify-center border-t border-line mt-3 pt-2.5">
              <button
                type="button"
                class="p-1 text-ink-soft hover:text-topbar-1 transition-colors text-[10px] font-bold uppercase tracking-wider"
                @click="viewMode = 'days'"
              >
                Kembali
              </button>
            </div>
          </template>

          <!-- Years selector mode -->
          <template v-else-if="viewMode === 'years'">
            <div class="flex items-center justify-between gap-1 mb-3 border-b border-line pb-2">
              <button
                type="button"
                class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
                @click="yearPivot -= 12"
              >
                <ChevronLeft class="w-4 h-4 text-ink-soft" />
              </button>
              <span class="text-xs font-bold text-ink tracking-wide">{{ yearPivot - 5 }} - {{ yearPivot + 6 }}</span>
              <button
                type="button"
                class="p-1 text-ink hover:bg-gray-100 rounded-lg transition-colors"
                @click="yearPivot += 12"
              >
                <ChevronRight class="w-4 h-4 text-ink-soft" />
              </button>
            </div>
            <div class="months-grid">
              <button
                v-for="yNum in yearsGridList"
                :key="yNum"
                type="button"
                class="py-2 text-[11px] font-semibold rounded-lg text-center transition-colors"
                :class="[viewYear === yNum ? 'bg-topbar-1 text-white' : 'text-ink hover:bg-gray-100']"
                @click="viewYear = yNum; viewMode = 'days'"
              >
                {{ yNum }}
              </button>
            </div>
            <div class="flex items-center justify-center border-t border-line mt-3 pt-2.5">
              <button
                type="button"
                class="p-1 text-ink-soft hover:text-topbar-1 transition-colors text-[10px] font-bold uppercase tracking-wider"
                @click="viewMode = 'days'"
              >
                Kembali
              </button>
            </div>
          </template>
        </div>

        <!-- Time Picker (Right Side) -->
        <div class="w-[110px] shrink-0 flex flex-col h-full justify-between">
          <div class="flex items-center gap-1 border-b border-line pb-1.5 mb-2.5">
            <Clock class="w-3.5 h-3.5 text-ink-soft" />
            <span class="text-xs font-bold text-ink">Pukul</span>
          </div>

          <div class="flex gap-1.5 h-[190px]">
            <!-- Hours list -->
            <div
              ref="hourContainer"
              class="flex-1 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin text-center"
            >
              <span class="text-[8px] font-bold text-ink-soft uppercase tracking-wider mb-1 block">Jam</span>
              <button
                v-for="h in hoursList"
                :key="h"
                type="button"
                class="py-0.5 text-[11px] font-medium rounded transition-all text-center block outline-none"
                :class="[selectedHour === h ? 'bg-topbar-1 text-white font-bold' : 'text-ink hover:bg-gray-100']"
                @click="selectHour(h)"
              >
                {{ h }}
              </button>
            </div>

            <!-- Minutes list -->
            <div
              ref="minuteContainer"
              class="flex-1 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin text-center border-l border-line pl-1"
            >
              <span class="text-[8px] font-bold text-ink-soft uppercase tracking-wider mb-1 block">Mnt</span>
              <button
                v-for="m in minutesList"
                :key="m"
                type="button"
                class="py-0.5 text-[11px] font-medium rounded transition-all text-center block outline-none"
                :class="[selectedMinute === m ? 'bg-topbar-1 text-white font-bold' : 'text-ink hover:bg-gray-100']"
                @click="selectMinute(m)"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <!-- OK Action -->
          <div class="flex justify-end border-t border-line mt-3 pt-2.5">
            <button
              type="button"
              class="text-[10px] font-bold text-topbar-1 hover:opacity-85 uppercase tracking-wide px-3 py-1 bg-[#FFF3EE] rounded-lg"
              @click="closeDropdown"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.calendar-grid {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
  gap: 3px !important;
}
.months-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 6px !important;
}
/* Custom thin scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 3px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 1.5px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}
</style>
