<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Info, Eye } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Rincian Pengajuan Aset',
})

const router = useRouter()
const route = useRoute()
const tabsStore = usePageTabsStore()
const id = Number(route.params.id)

const selectedRequest = ref<any>(null)
const loading = ref(true)

// Preview state
const showPreview = ref(false)
const previewFileUrl = ref('')
const previewFileName = ref('')

async function fetchDetail() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/asset-requests/${id}`)
    selectedRequest.value = res.data
  } catch (e) {
    toast.error('Gagal mengambil rincian pengajuan')
    router.push('/hr/asset-request')
  } finally {
    loading.value = false
  }
}

// Helper to resolve attachment url using download proxy
function getFileUrl(filePath: string) {
  if (!filePath) return ''
  if (filePath.startsWith('/api/v1/attachments/download') || filePath.startsWith('http')) {
    return filePath
  }
  return `/api/v1/attachments/download?file=${encodeURIComponent(filePath)}`
}

function previewImage(filePath: string, title: string) {
  if (filePath.endsWith('.pdf')) {
    window.open(getFileUrl(filePath), '_blank')
  } else {
    previewFileName.value = title
    previewFileUrl.value = getFileUrl(filePath)
    showPreview.value = true
  }
}

onMounted(() => {
  fetchDetail()
})

// Watch tabs structure and keep tab title updated
const pagePath = route.path
watch(
  () => tabsStore.tabs,
  (newTabs) => {
    const activeTab = newTabs.find((t) => t.path === pagePath)
    if (activeTab) {
      activeTab.title = 'Detail Asset Request'
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Detail Pengajuan Aset" breadcrumb="HR / Asset Requests / Detail">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/asset-request')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke List</span>
        </button>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="py-24 bg-white rounded-xl border border-line flex justify-center items-center my-4">
      <span class="text-xs text-ink-soft animate-pulse">Memuat rincian data pengajuan...</span>
    </div>

    <UiCard v-else-if="selectedRequest" class="bg-white border border-line rounded-xl shadow-sm p-6 my-4 flex flex-col gap-4">
      <!-- Header -->
      <div class="border-b border-line pb-3">
        <div class="text-[10px] font-bold text-topbar-1 uppercase tracking-widest font-mono">{{ selectedRequest.code }}</div>
        <div class="flex items-center justify-between mt-1">
          <h3 class="text-sm font-bold text-ink">Pengaju: {{ selectedRequest.requesterName }} ({{ selectedRequest.requesterEmployeeCode }})</h3>
          <span
            class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize border"
            :class="{
              'bg-yellow-50 text-yellow-600 border-yellow-200': selectedRequest.status === 'pending',
              'bg-blue-50 text-blue-600 border-blue-200': selectedRequest.status === 'approved',
              'bg-green-50 text-green-600 border-green-200': selectedRequest.status === 'completed',
              'bg-red-50 text-red-600 border-red-200': selectedRequest.status === 'rejected',
            }"
          >
            {{ selectedRequest.status }}
          </span>
        </div>
      </div>

      <!-- Master info grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">PT (Company)</span>
          <span class="font-semibold text-ink">{{ selectedRequest.ptCode }} - {{ selectedRequest.ptName }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Category</span>
          <span class="font-semibold text-ink capitalize">{{ selectedRequest.category === 'penambahan' ? 'Penambahan Asset' : 'Pengganti Asset Rusak' }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Payment Details</span>
          <span class="font-semibold text-ink uppercase">{{ selectedRequest.bank }} - {{ selectedRequest.rekening }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Marketplace / Payment To</span>
          <span class="font-semibold text-ink capitalize">{{ selectedRequest.marketplace }} ({{ selectedRequest.paymentTo }})</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Request / Payment Date</span>
          <span class="font-semibold text-ink">{{ selectedRequest.requestDate }} / {{ selectedRequest.paymentDate || '-' }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Finance PIC</span>
          <span class="font-semibold text-ink">{{ selectedRequest.financeName }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-ink-soft block">Total Price</span>
          <span class="font-bold text-green-600 font-mono text-sm">
            Rp {{ Number(selectedRequest.price).toLocaleString('id-ID') }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <div class="border-t border-line pt-3" v-if="selectedRequest.description">
        <span class="text-[10px] uppercase font-bold text-ink-soft block mb-1">Description</span>
        <p class="text-xs text-ink bg-gray-50 p-2.5 rounded-lg border border-line leading-relaxed">
          {{ selectedRequest.description }}
        </p>
      </div>

      <!-- Master Attachments -->
      <div class="border-t border-line pt-3">
        <span class="text-[10px] uppercase font-bold text-ink-soft block mb-1.5">Master Attachments</span>
        <div v-if="!selectedRequest.images || !selectedRequest.images.length" class="text-xs text-ink-soft">
          Tidak ada lampiran utama.
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          <div
            v-for="(img, idx) in selectedRequest.images"
            :key="idx"
            class="group relative border border-line rounded-lg overflow-hidden h-20 flex items-center justify-center bg-gray-50 shadow-sm cursor-pointer"
            @click="previewImage(img, `Attachment Master #${idx+1}`)"
            title="Klik untuk preview"
          >
            <img :src="getFileUrl(img)" class="max-h-full max-w-full object-contain" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      <!-- Items Details -->
      <div class="border-t border-line pt-3">
        <span class="text-[10px] uppercase font-bold text-ink-soft block mb-2">Daftar Item Detail</span>
        <div class="flex flex-col gap-3">
          <div
            v-for="(item, idx) in selectedRequest.items"
            :key="item.id || idx"
            class="border border-line rounded-xl p-3 bg-gray-50 flex flex-col gap-2"
          >
            <div class="flex justify-between border-b border-line pb-1.5">
              <span class="font-bold text-xs text-ink">{{ item.name }}</span>
              <span class="font-mono text-[10px] bg-white border border-line px-2 py-0.5 rounded text-ink-soft font-semibold">{{ item.arfNumber }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span class="text-ink-soft">Room / Manufacture: </span>
                <span class="font-medium text-ink block sm:inline">{{ item.roomName }} / {{ item.mfgName }}</span>
              </div>
              <div>
                <span class="text-ink-soft">Qty / Price: </span>
                <span class="font-medium text-ink block sm:inline">{{ item.quantity }} x Rp {{ Number(item.price).toLocaleString('id-ID') }}</span>
              </div>
              <div>
                <span class="text-ink-soft">Age / Condition: </span>
                <span class="font-medium text-ink block sm:inline capitalize">{{ item.economicAge }} Thn / {{ item.condition }}</span>
              </div>
              <div>
                <span class="text-ink-soft">Subtotal Price: </span>
                <span class="font-bold text-green-600 font-mono block sm:inline">Rp {{ Number(item.totalPrice).toLocaleString('id-ID') }}</span>
              </div>
            </div>
            <!-- Detail attachments -->
            <div v-if="item.images && item.images.length" class="mt-1">
              <span class="text-[8px] uppercase font-bold text-ink-soft block mb-1">Item Images</span>
              <div class="flex gap-1.5 flex-wrap">
                <div
                  v-for="(detImg, dIdx) in item.images"
                  :key="dIdx"
                  class="group relative w-12 h-12 rounded border border-line overflow-hidden bg-white flex items-center justify-center shadow-sm cursor-pointer"
                  @click="previewImage(detImg, `Foto Item #${idx+1} - ${item.name}`)"
                  title="Klik untuk preview"
                >
                  <img :src="getFileUrl(detImg)" class="max-h-full max-w-full object-contain" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye class="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Automatic Generation Info Hint -->
      <div class="bg-[#FFF3EE] border border-[#FFE5DA] rounded-lg p-3 text-xs flex gap-2 text-topbar-1 mt-1">
        <Info class="w-4 h-4 shrink-0 mt-0.5" />
        <div class="leading-relaxed">
          <strong>Catatan Otomatisasi Master Aset:</strong> Menyetujui pengajuan ini (mengubah status menjadi <em>Approved</em> atau <em>Completed</em>) akan secara otomatis men-generate entri master aset baru pada list aset utama berdasarkan jumlah kuantitas masing-masing item detail.
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end gap-2 border-t border-line pt-4 mt-2">
        <UiButton variant="secondary" @click="router.push('/hr/asset-request')">Kembali ke Daftar</UiButton>
      </div>
    </UiCard>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <UiModal v-model="showPreview" :title="previewFileName" size="lg">
        <div class="flex items-center justify-center p-2 bg-[#FAFAFA] rounded-lg border border-line min-h-[200px]">
          <img :src="previewFileUrl" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
        </div>
      </UiModal>
    </Teleport>
  </div>
</template>
