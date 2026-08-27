<script setup lang="ts">
import { User, LogOut } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
onClickOutside(rootEl, () => (open.value = false))

const initials = computed(() => (auth.user?.email || '?').charAt(0).toUpperCase())

async function onLogout() {
  open.value = false
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div ref="rootEl" class="relative">
    <button type="button" class="flex items-center gap-2" @click="open = !open">
      <div class="w-6 h-6 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center">
        {{ initials }}
      </div>
      <span class="text-white text-xs font-medium">{{ auth.user?.email }}</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-52 rounded-md bg-white border border-line shadow-lg py-1.5 z-30 text-ink"
    >
      <div class="px-3 py-2 border-b border-line">
        <div class="text-xs font-semibold truncate">{{ auth.user?.email }}</div>
        <div class="text-[11px] text-ink-soft">{{ auth.user?.role }}</div>
      </div>
      <NuxtLink
        to="/profile"
        class="flex items-center gap-2 px-3 py-2 text-xs hover:bg-canvas"
        @click="open = false"
      >
        <User class="w-3.5 h-3.5" />
        Profile
      </NuxtLink>
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-canvas"
        @click="onLogout"
      >
        <LogOut class="w-3.5 h-3.5" />
        Logout
      </button>
    </div>
  </div>
</template>
