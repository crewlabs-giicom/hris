<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

// static placeholder data until a notifications endpoint exists
const notifications = [
  { id: 1, title: 'Pengajuan cuti baru menunggu approval', time: '10 menit lalu' },
  { id: 2, title: 'Kontrak karyawan akan berakhir minggu ini', time: '2 jam lalu' },
  { id: 3, title: 'Asset request #A-104 disetujui', time: 'Kemarin' },
]

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
onClickOutside(rootEl, () => (open.value = false))
</script>

<template>
  <div ref="rootEl" class="relative">
    <button type="button" class="relative" aria-label="Notifikasi" @click="open = !open">
      <Bell class="w-[18px] h-[18px] text-white" />
      <span
        v-if="notifications.length"
        class="absolute -top-1.5 -right-1.5 text-[9px] w-3.5 h-3.5 rounded-full bg-white text-topbar-2 font-bold flex items-center justify-center"
      >
        {{ notifications.length }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-72 rounded-md bg-white border border-line shadow-lg py-1.5 z-30 text-ink"
    >
      <div class="px-3 py-2 border-b border-line text-xs font-semibold">Notifikasi</div>
      <div v-if="!notifications.length" class="px-3 py-4 text-xs text-ink-soft text-center">
        Tidak ada notifikasi
      </div>
      <div
        v-for="n in notifications"
        :key="n.id"
        class="px-3 py-2 text-xs hover:bg-canvas border-b border-line last:border-b-0"
      >
        <div class="text-ink">{{ n.title }}</div>
        <div class="text-[11px] text-ink-soft mt-0.5">{{ n.time }}</div>
      </div>
    </div>
  </div>
</template>
