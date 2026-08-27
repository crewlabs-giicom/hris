<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: boolean; title: string; size?: 'md' | 'lg' | 'xl' | '2xl' }>(), {
  size: 'md',
})
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const sizeClass = { md: 'max-w-[440px]', lg: 'max-w-[720px]', xl: 'max-w-[920px]', '2xl': 'max-w-[1180px]' }[props.size]

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="close"
        @keydown.esc="close"
      >
        <Transition
          appear
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div class="w-full max-h-[90vh] flex flex-col bg-white border border-line rounded-card shadow-xl" :class="sizeClass">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-line shrink-0">
              <h3 class="text-[14px] font-bold text-ink">{{ props.title }}</h3>
              <button type="button" class="text-ink-soft hover:text-ink text-sm leading-none" @click="close">
                &#10005;
              </button>
            </div>
            <div class="px-5 py-4 overflow-y-auto">
              <slot />
            </div>
            <div v-if="$slots.footer" class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
