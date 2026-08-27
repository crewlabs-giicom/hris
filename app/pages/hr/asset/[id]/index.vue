<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Edit2, RefreshCw, Eye, Download } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const tabsStore = usePageTabsStore()

const id = Number(route.params.id)
const asset = ref<any>(null)
const loading = ref(true)

// Photo preview state
const previewImage = ref<string | null>(null)

async function fetchDetail() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/assets/${id}`)
    asset.value = res.data
  } catch (e) {
    toast.error('Gagal memuat detail informasi aset')
  } finally {
    loading.value = false
  }
}

function openImage(path: string) {
  previewImage.value = `/api/v1/attachments/download?file=${encodeURIComponent(path)}`
}

onMounted(() => {
  fetchDetail()
})

// Watch tabs structure to update title dynamically
const pagePath = route.path
watch(
  () => [tabsStore.tabs, asset.value],
  () => {
    const activeTab = tabsStore.tabs.find((t) => t.path === pagePath)
    if (activeTab && asset.value) {
      activeTab.title = `Detail: ${asset.value.name}`
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader :title="asset ? asset.name : 'Detail Aset'" breadcrumb="HR / Assets / Detail">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/asset')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Daftar Aset</span>
        </button>

        <button
          v-if="asset"
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="router.push(`/hr/asset/${id}/edit`)"
        >
          <Edit2 class="w-4 h-4" />
          <span>Edit Aset</span>
        </button>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="py-24 bg-white rounded-xl border border-line flex justify-center items-center my-4">
      <span class="text-xs text-ink-soft animate-pulse">Mengambil rincian informasi aset...</span>
    </div>

    <div v-else-if="!asset" class="py-16 bg-white rounded-xl border border-line flex flex-col items-center justify-center my-4">
      <p class="text-xs text-ink-soft mb-2">Data aset tidak ditemukan.</p>
      <button class="text-xs text-topbar-1 font-semibold" @click="fetchDetail">Coba Lagi</button>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Left side: Primary specifications and Assignments -->
      <div class="lg:col-span-2 flex flex-col gap-5">
        <!-- Master Specs Card -->
        <UiCard class="p-6">
          <div class="border-b border-line pb-3 mb-4">
            <span class="text-[10px] font-bold text-topbar-1 uppercase tracking-widest font-mono">{{ asset.code || '-' }}</span>
            <h3 class="text-lg font-bold text-ink">{{ asset.name }}</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">PT (Company)</span>
              <span class="font-semibold text-ink">{{ asset.ptCode }} - {{ asset.ptName }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Pabrikan / Merk</span>
              <span class="font-semibold text-ink">{{ asset.manufactureName }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Ruangan</span>
              <span class="font-semibold text-ink">{{ asset.roomName }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Divisi</span>
              <span class="font-semibold text-ink">{{ asset.divisionName }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Periode Pembelian</span>
              <span class="font-semibold text-ink font-mono">{{ asset.purchaseFromDate }} s/d {{ asset.purchaseToDate }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Umur Ekonomis / Kondisi</span>
              <span class="font-semibold text-ink capitalize">{{ asset.economicAge }} Bulan / {{ asset.condition }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Harga Perolehan</span>
              <span class="font-semibold text-ink font-mono text-green-600 text-sm">
                Rp {{ Number(asset.price).toLocaleString('id-ID') }}
              </span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Lokasi / Kategori / Status</span>
              <span class="font-semibold text-ink capitalize">{{ asset.location }} / {{ asset.category || '-' }} / {{ asset.status }}</span>
            </div>
          </div>

          <div class="border-t border-line mt-4 pt-4" v-if="asset.description">
            <span class="text-[10px] uppercase font-bold text-ink-soft block mb-1">Keterangan / Deskripsi</span>
            <p class="text-xs text-ink bg-gray-50 p-3 rounded-lg border border-line leading-relaxed">
              {{ asset.description }}
            </p>
          </div>
        </UiCard>

        <!-- Assignments Card -->
        <UiCard class="p-6">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider text-topbar-1 mb-3">
            Daftar Penanggung Jawab
          </h3>
          <div v-if="!asset.employees || !asset.employees.length" class="text-xs text-ink-soft py-4 text-center bg-gray-50 rounded-lg border border-dashed border-line">
            Belum ada karyawan yang ditunjuk sebagai penanggung jawab aset ini.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="emp in asset.employees"
              :key="emp.id"
              class="inline-flex items-center bg-[#FFF3EE] text-topbar-1 text-xs font-semibold px-3 py-1 rounded-full border border-[#FFE5DA]"
            >
              {{ emp.fullName }} ({{ emp.employeeCode }})
            </span>
          </div>
        </UiCard>
      </div>

      <!-- Right side: Realtime Depreciation Card & Gallery -->
      <div class="flex flex-col gap-5">
        <!-- Depreciation Stats Card -->
        <UiCard class="p-6 border-2 border-green-500/20 bg-green-50/5">
          <div class="flex items-center justify-between border-b border-line pb-2 mb-4">
            <h3 class="text-xs font-bold text-ink uppercase tracking-wider text-green-700 flex items-center gap-1.5">
              <RefreshCw class="w-4 h-4" />
              <span>Penyusutan Aset (Real-time)</span>
            </h3>
          </div>

          <div class="flex flex-col gap-3.5">
            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Sisa Masa Manfaat</span>
              <span class="text-lg font-bold text-ink">{{ asset.sisaMasaManfaat }} <span class="text-xs font-medium text-ink-soft">Bulan (dari total {{ asset.economicAge }} bln)</span></span>
            </div>

            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Nilai Sisa Manfaat (Nilai Buku)</span>
              <span class="text-lg font-bold text-green-600 font-mono">
                Rp {{ Number(asset.nilaiSisaManfaat).toLocaleString('id-ID') }}
              </span>
            </div>

            <div>
              <span class="text-[10px] uppercase font-bold text-ink-soft block mb-0.5">Sudah Disusutkan</span>
              <span class="font-semibold text-ink-soft text-xs">{{ asset.kaliDisusutkan }} kali</span>
            </div>

            <button
              type="button"
              class="text-xs font-bold text-[#F08050] bg-white border border-[#F08050] hover:bg-[#FFF3EE] py-2 px-3 rounded-lg shadow-sm mt-2 transition-all flex items-center justify-center gap-1.5 w-full"
              @click="router.push(`/hr/asset/depreciation?search=${encodeURIComponent(asset.code || asset.name)}`)"
            >
              <Eye class="w-4 h-4" />
              <span>Lihat Detail Penyusutan</span>
            </button>
          </div>
        </UiCard>

        <!-- Image Gallery Card -->
        <UiCard class="p-6">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider text-topbar-1 mb-3">
            Foto Aset
          </h3>
          <div v-if="!asset.images || !asset.images.length" class="text-xs text-ink-soft py-6 text-center bg-gray-50 rounded-lg border border-dashed border-line">
            Tidak ada foto aset terlampir.
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <div
              v-for="img in asset.images"
              :key="img.id"
              class="border border-line rounded-lg overflow-hidden h-24 flex items-center justify-center bg-gray-50 hover:border-topbar-1 transition-all shadow-sm"
              @click="openImage(img.attachment)"
            >
              <img
                :src="`/api/v1/attachments/download?file=${encodeURIComponent(img.attachment)}`"
                alt="Foto Aset"
                class="max-h-full max-w-full object-contain cursor-pointer"
              />
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <UiModal v-model="previewImage" title="Preview Foto Aset" :fullscreen="false">
      <div class="flex justify-center p-2">
        <img :src="previewImage" alt="Asset Preview" class="max-h-[60vh] object-contain rounded-lg shadow-sm" />
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="previewImage = null">Tutup</UiButton>
      </template>
    </UiModal>
  </div>
</template>
