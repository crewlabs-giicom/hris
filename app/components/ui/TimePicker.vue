<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Clock, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string | undefined
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Pilih Jam...', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px', width: '160px' })

const hourContainer = ref<HTMLElement | null>(null)
const minuteContainer = ref<HTMLElement | null>(null)

// Hours (00 - 23)
const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
// Minutes (00 - 59)
const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const selectedHour = ref('12')
const selectedMinute = ref('00')

// Parse modelValue (HH:MM or HH:MM:SS)
watch(
  () => props.modelValue,
  (val) => {
    if (val && val.includes(':')) {
      const parts = val.split(':')
      selectedHour.value = parts[0] || '12'
      selectedMinute.value = parts[1] || '00'
    }
  },
  { immediate: true }
)

const displayText = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.slice(0, 5) // Return HH:MM
})

function openDropdown() {
  if (props.disabled) return
  const rect = triggerRef.value!.getBoundingClientRect()
  const margin = 8
  const width = 160
  const dropdownHeight = 220
  
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
  
  // Auto-scroll to selected hour/minute
  nextTick(() => {
    scrollToSelected()
  })
}

function scrollToSelected() {
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

function selectHour(h: string) {
  selectedHour.value = h
  emitValue()
}

function selectMinute(m: string) {
  selectedMinute.value = m
  emitValue()
}

function emitValue() {
  const timeStr = `${selectedHour.value}:${selectedMinute.value}`
  emit('update:modelValue', timeStr)
}

function clearValue() {
  emit('update:modelValue', '')
  closeDropdown()
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
        <Clock class="w-4 h-4 text-ink-soft shrink-0" />
        <span v-if="displayText" class="font-medium text-ink font-mono">{{ displayText }}</span>
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

    <!-- Dropdown Time Selector -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-50 bg-white border border-line rounded-xl shadow-lg p-3 w-[160px] select-none flex flex-col"
        :style="menuStyle"
      >
        <div class="flex gap-2 h-[160px] border-b border-line pb-2">
          <!-- Hours Column -->
          <div
            ref="hourContainer"
            class="flex-1 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin pr-1 text-center"
          >
            <span class="text-[9px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Jam</span>
            <button
              v-for="h in hoursList"
              :key="h"
              type="button"
              class="py-1 text-xs font-medium rounded transition-all text-center block outline-none"
              :class="[
                selectedHour === h
                  ? 'bg-topbar-1 text-white font-bold'
                  : 'text-ink hover:bg-gray-100'
              ]"
              @click="selectHour(h)"
            >
              {{ h }}
            </button>
          </div>

          <!-- Minutes Column -->
          <div
            ref="minuteContainer"
            class="flex-1 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin pr-1 text-center border-l border-line pl-1.5"
          >
            <span class="text-[9px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Menit</span>
            <button
              v-for="m in minutesList"
              :key="m"
              type="button"
              class="py-1 text-xs font-medium rounded transition-all text-center block outline-none"
              :class="[
                selectedMinute === m
                  ? 'bg-topbar-1 text-white font-bold'
                  : 'text-ink hover:bg-gray-100'
              ]"
              @click="selectMinute(m)"
            >
              {{ m }}
            </button>
          </div>
        </div>

        <!-- Footer OK -->
        <div class="flex justify-end pt-2">
          <button
            type="button"
            class="text-[11px] font-bold text-topbar-1 hover:opacity-85 uppercase tracking-wide px-3 py-1 bg-[#FFF3EE] rounded-lg"
            @click="closeDropdown"
          >
            OK
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Custom thin scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}
</style>
