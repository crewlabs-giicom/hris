<script setup lang="ts">
const props = defineProps<{
  steps: Array<{ key: string; label: string }>
  currentStep: number
  savingIndicator?: 'idle' | 'saving' | 'saved'
  lastSavedAt?: string | null
}>()
const emit = defineEmits<{ 'go-to-step': [number] }>()

const scrollerRef = ref<HTMLElement | null>(null)
const stepRefs = ref<HTMLElement[]>([])

watch(
  () => props.currentStep,
  async () => {
    await nextTick()
    stepRefs.value[props.currentStep]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  },
  { immediate: true }
)

const relativeSavedAt = computed(() => {
  if (!props.lastSavedAt) return ''
  const seconds = Math.max(0, Math.round((Date.now() - new Date(props.lastSavedAt).getTime()) / 1000))
  if (seconds < 5) return 'baru saja'
  if (seconds < 60) return `${seconds} detik lalu`
  const minutes = Math.round(seconds / 60)
  return `${minutes} menit lalu`
})
</script>

<template>
  <div class="mb-4">
    <div class="relative">
      <div ref="scrollerRef" class="flex items-center gap-1 overflow-x-auto pb-2 scroll-smooth">
        <template v-for="(step, i) in steps" :key="step.key">
          <button
            :ref="(el) => (stepRefs[i] = el as HTMLElement)"
            type="button"
            class="flex items-center gap-1.5 shrink-0 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full transition-colors"
            :class="[
              i === currentStep ? 'bg-gradient-to-r from-topbar-1 to-topbar-2 text-white' : '',
              i < currentStep ? 'text-topbar-1 hover:bg-[#FFF3EE] cursor-pointer' : '',
              i > currentStep ? 'text-ink-soft cursor-default' : '',
            ]"
            :disabled="i > currentStep"
            @click="i < currentStep && emit('go-to-step', i)"
          >
            <span
              class="w-4 h-4 rounded-full flex items-center justify-center text-[9.5px] shrink-0"
              :class="i === currentStep ? 'bg-white/25' : i < currentStep ? 'bg-topbar-1/10' : 'bg-[#F0F0F0]'"
            >
              {{ i < currentStep ? '✓' : i + 1 }}
            </span>
            <span :class="i === currentStep ? '' : 'hidden sm:inline'">{{ step.label }}</span>
          </button>
          <div v-if="i < steps.length - 1" class="w-4 h-px bg-line shrink-0" />
        </template>
      </div>
      <div class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
      <div class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <p v-if="savingIndicator && savingIndicator !== 'idle'" class="text-[10.5px] text-ink-soft mt-1">
        <span v-if="savingIndicator === 'saving'">Menyimpan draft...</span>
        <span v-else>Tersimpan {{ relativeSavedAt }}</span>
      </p>
    </Transition>
  </div>
</template>
