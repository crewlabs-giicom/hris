<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Plus, X, Upload, FileText, Image as ImageIcon, Eye } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Buat Pengajuan Aset Baru',
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const tabsStore = usePageTabsStore()

// Logged-in employee details
const currentEmployee = ref<{ id: number; employeeCode: string; fullName: string } | null>(null)

async function fetchMe() {
  try {
    const res = await useApi<any>('/api/v1/employees/me')
    currentEmployee.value = res.data
  } catch (e) {
    console.error('Failed to load profile employee')
  }
}

const categoryOptions = [
  { id: 'penambahan', label: 'Penambahan Asset' },
  { id: 'pengganti', label: 'Pengganti Asset Rusak' },
]

const marketplaceOptions = [
  { id: 'shopee', label: 'Shopee' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'non marketplace', label: 'Non Marketplace' },
]

const bankOptions = [
  { id: 'bca', label: 'BCA' },
  { id: 'mandiri', label: 'Mandiri' },
]

const conditionOptions = [
  { id: 'new', label: 'New' },
  { id: 'good', label: 'Good' },
  { id: 'old', label: 'Old' },
]

const form = ref({
  category: 'penambahan',
  ptId: '',
  marketplace: 'non marketplace',
  bank: 'bca',
  rekening: '',
  paymentTo: '',
  financeId: '',
  requestDate: new Date().toISOString().slice(0, 10),
  description: '',
  images: [] as string[],
  items: [] as Array<{
    name: string;
    arfNumber: string;
    roomId: string;
    condition: string;
    price: string | number;
    quantity: number;
    manufacturerId: string;
    economicAge: number;
    images: string[];
  }>,
})

const submitting = ref(false)

// Master attachments drag, drop & paste zone state
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const attachments = ref<Array<{
  tempId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploading: boolean;
  filePath: string;
}>>([])

// Preview file state
const showPreview = ref(false)
const previewFileUrl = ref('')
const previewFileName = ref('')

// Helper to resolve attachment url using download proxy
function getFileUrl(filePath: string) {
  if (!filePath) return ''
  if (filePath.startsWith('/api/v1/attachments/download') || filePath.startsWith('http')) {
    return filePath
  }
  return `/api/v1/attachments/download?file=${encodeURIComponent(filePath)}`
}

function triggerFileBrowser() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i])
    }
  }
  if (fileInput.value) fileInput.value.value = ''
}

function handleFileDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i])
    }
  }
}

function handleFilePaste(e: ClipboardEvent) {
  // If active uploading item is focused, let handleItemFilePaste handle it instead
  if (activeUploadingItemIndex.value !== null) return

  const items = Array.from(e.clipboardData?.items || [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  if (imageItem) {
    const file = imageItem.getAsFile()
    if (file) {
      const namedFile = new File([file], `clipboard-screenshot-${Date.now()}.png`, { type: file.type })
      uploadFile(namedFile)
    }
  }
}

async function uploadFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    toast.error(`Format file tidak didukung: ${file.type}. Harap upload JPG, PNG, atau PDF.`)
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 5MB.')
    return
  }

  const tempId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random())
  const tempItem = ref({
    tempId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploading: true,
    filePath: '',
  })
  attachments.value.push(tempItem.value)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await useApi<any>('/api/v1/attachments/upload', {
      method: 'POST',
      body: formData,
    })
    tempItem.value.filePath = res.data.filePath
    tempItem.value.uploading = false
    syncImages()
  } catch (err) {
    toast.error(`Gagal mengunggah ${file.name}`)
    attachments.value = attachments.value.filter(a => a.tempId !== tempId)
  }
}

function removeAttachment(idx: number) {
  attachments.value.splice(idx, 1)
  syncImages()
}

// Preview Master Image
function previewAttachment(file: any) {
  if (file.mimeType === 'application/pdf') {
    window.open(getFileUrl(file.filePath), '_blank')
  } else {
    previewFileName.value = file.fileName
    previewFileUrl.value = getFileUrl(file.filePath)
    showPreview.value = true
  }
}

// Preview Item Image
function previewDetailImage(filePath: string, itemName: string) {
  previewFileName.value = `Foto Detail - ${itemName || 'Item'}`
  previewFileUrl.value = getFileUrl(filePath)
  showPreview.value = true
}

function syncImages() {
  form.value.images = attachments.value
    .filter(a => !a.uploading && a.filePath)
    .map(a => a.filePath)
}

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Dynamic Items list helpers
function addItemRow() {
  form.value.items.push({
    name: '',
    arfNumber: '',
    roomId: '',
    condition: 'new',
    price: '',
    quantity: 1,
    manufacturerId: '',
    economicAge: 1,
    images: [],
  })
}

function removeItemRow(idx: number) {
  form.value.items.splice(idx, 1)
}

// Detail item attachments upload
const activeUploadingItemIndex = ref<number | null>(null)
const itemFileInput = ref<HTMLInputElement | null>(null)

function triggerItemFileBrowser(itemIdx: number) {
  activeUploadingItemIndex.value = itemIdx
  itemFileInput.value?.click()
}

function handleItemFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && activeUploadingItemIndex.value !== null) {
    for (let i = 0; i < files.length; i++) {
      uploadItemFile(files[i], activeUploadingItemIndex.value)
    }
  }
  if (itemFileInput.value) itemFileInput.value.value = ''
}

function handleItemFileDrop(e: DragEvent, itemIdx: number) {
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      uploadItemFile(files[i], itemIdx)
    }
  }
}

function handleItemFilePaste(e: ClipboardEvent, itemIdx: number) {
  const items = Array.from(e.clipboardData?.items || [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  if (imageItem) {
    const file = imageItem.getAsFile()
    if (file) {
      const namedFile = new File([file], `item-screenshot-${Date.now()}.png`, { type: file.type })
      uploadItemFile(namedFile, itemIdx)
    }
  }
}

async function uploadItemFile(file: File, itemIdx: number) {
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    toast.error(`Format file tidak didukung: ${file.type}. Harap upload JPG atau PNG.`)
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 5MB.')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await useApi<any>('/api/v1/attachments/upload', {
      method: 'POST',
      body: formData,
    })
    form.value.items[itemIdx].images.push(res.data.filePath)
  } catch (err) {
    toast.error(`Gagal mengunggah lampiran detail: ${file.name}`)
  }
}

function removeItemImage(itemIdx: number, imgIdx: number) {
  form.value.items[itemIdx].images.splice(imgIdx, 1)
}

const totalPriceCalculated = computed(() => {
  return form.value.items.reduce((acc, item) => {
    const p = Number(item.price) || 0
    const q = Number(item.quantity) || 1
    return acc + p * q
  }, 0)
})

async function onSubmit() {
  const f = form.value
  if (!f.ptId || !f.rekening || !f.paymentTo || !f.financeId || !f.requestDate) {
    toast.error('Mohon lengkapi semua kolom wajib pengajuan master')
    return
  }

  // Validate items
  for (const item of f.items) {
    if (!item.name || !item.arfNumber || !item.roomId || !item.price || !item.manufacturerId) {
      toast.error('Mohon lengkapi seluruh kolom wajib pada setiap item detail')
      return
    }
  }

  submitting.value = true
  try {
    await useApi('/api/v1/asset-requests', {
      method: 'POST',
      body: f,
    })
    toast.success('Pengajuan aset baru berhasil dibuat!')
    router.push('/hr/asset-request')
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan pengajuan')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchMe()
  addItemRow() // start with 1 item row
})

// Watch tabs structure and keep tab title updated
const pagePath = route.path
watch(
  () => tabsStore.tabs,
  (newTabs) => {
    const activeTab = newTabs.find((t) => t.path === pagePath)
    if (activeTab) {
      activeTab.title = 'Add Asset Request'
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div @paste="handleFilePaste">
    <!-- Page Header -->
    <UiPageHeader title="Buat Pengajuan Aset Baru" breadcrumb="HR / Asset Requests / New">
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Left Column: Master Form & Details -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <!-- Master Form Card -->
        <UiCard class="p-6">
          <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
            <!-- User Profile Display -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2 bg-gray-50 border border-line rounded-lg p-2.5 text-xs">
              <div>
                <span class="text-[9px] uppercase font-bold text-ink-soft block">Requester Name</span>
                <span class="font-bold text-ink">{{ currentEmployee?.fullName || authStore.user?.email || '-' }}</span>
              </div>
              <div>
                <span class="text-[9px] uppercase font-bold text-ink-soft block">Requester Employee Code</span>
                <span class="font-bold text-ink">{{ currentEmployee?.employeeCode || '-' }}</span>
              </div>
            </div>

            <!-- Category & PT -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiFormField label="Category" required>
                <UiSelectSearch
                  v-model="form.category"
                  :options="categoryOptions"
                  placeholder="Pilih Kategori"
                />
              </UiFormField>
              <UiFormField label="PT (Company)" required>
                <UiSelectSearch
                  v-model="form.ptId"
                  endpoint="/api/v1/master-data/companies"
                  placeholder="Pilih PT"
                />
              </UiFormField>
            </div>

            <!-- Marketplace & Bank -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiFormField label="Marketplace" required>
                <UiSelectSearch
                  v-model="form.marketplace"
                  :options="marketplaceOptions"
                  placeholder="Pilih Marketplace"
                />
              </UiFormField>
              <UiFormField label="Bank" required>
                <UiSelectSearch
                  v-model="form.bank"
                  :options="bankOptions"
                  placeholder="Pilih Bank"
                />
              </UiFormField>
            </div>

            <!-- Account number / VA & Payment To -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiFormField label="Nomor Rekening / No Virtual Account" required>
                <input
                  v-model="form.rekening"
                  required
                  placeholder="Account number or VA..."
                  class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                />
              </UiFormField>
              <UiFormField label="Payment To" required>
                <input
                  v-model="form.paymentTo"
                  required
                  placeholder="Penerima pembayaran..."
                  class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                />
              </UiFormField>
            </div>

            <!-- Finance PIC & Request Date -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UiFormField label="Finance PIC" required>
                <UiSelectSearch
                  v-model="form.financeId"
                  endpoint="/api/v1/employees"
                  labelKey="fullName"
                  placeholder="Pilih Staff Finance"
                />
              </UiFormField>
              <UiFormField label="Request Date" required>
                <UiDatePicker v-model="form.requestDate" />
              </UiFormField>
            </div>

            <!-- Description -->
            <UiFormField label="Description">
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="Berikan alasan atau detail tambahan pengajuan..."
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              ></textarea>
            </UiFormField>
          </form>
        </UiCard>

        <!-- Dynamic Details Items Section -->
        <UiCard class="p-6">
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-bold text-ink uppercase tracking-wider text-topbar-1">Asset Request Details (Daftar Item)</span>
            <button
              type="button"
              class="text-xs px-3 py-1.5 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg flex items-center gap-1 shadow-sm"
              @click="addItemRow"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Item</span>
            </button>
          </div>

          <!-- Dynamic details loop -->
          <div class="flex flex-col gap-4">
            <div
              v-for="(item, itemIdx) in form.items"
              :key="itemIdx"
              class="border border-line rounded-xl p-3.5 bg-canvas relative flex flex-col gap-3"
            >
              <!-- Remove item button -->
              <button
                v-if="form.items.length > 1"
                type="button"
                class="absolute top-3 right-3 text-ink-soft hover:text-red-500 bg-white border border-line rounded-full p-1"
                @click="removeItemRow(itemIdx)"
              >
                <X class="w-3.5 h-3.5" />
              </button>

              <div class="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1 border-b border-line pb-1">
                Item #{{ itemIdx + 1 }}
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Item Name -->
                <UiFormField label="Item Name" required>
                  <input
                    v-model="item.name"
                    required
                    placeholder="Nama barang..."
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                  />
                </UiFormField>

                <!-- ARF Number -->
                <UiFormField label="ARF Number" required>
                  <input
                    v-model="item.arfNumber"
                    required
                    placeholder="Kode ARF item..."
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                  />
                </UiFormField>

                <!-- Room & Condition -->
                <UiFormField label="Room List" required>
                  <UiSelectSearch
                    v-model="item.roomId"
                    endpoint="/api/v1/master-data/rooms"
                    placeholder="Pilih Ruangan"
                  />
                </UiFormField>
                <UiFormField label="Condition" required>
                  <UiSelectSearch
                    v-model="item.condition"
                    :options="conditionOptions"
                    placeholder="Pilih Kondisi"
                  />
                </UiFormField>

                <!-- Price & Quantity -->
                <UiFormField label="Price" required>
                  <input
                    v-model.number="item.price"
                    type="number"
                    required
                    placeholder="Harga satuan..."
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                  />
                </UiFormField>
                <UiFormField label="Quantity" required>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    required
                    min="1"
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                  />
                </UiFormField>

                <!-- Manufacture & Economic Age -->
                <UiFormField label="Manufacture List" required>
                  <UiSelectSearch
                    v-model="item.manufacturerId"
                    endpoint="/api/v1/master-data/manufacturers"
                    placeholder="Pilih Pabrikan"
                  />
                </UiFormField>
                <UiFormField label="Economic Age (Tahun)" required>
                  <input
                    v-model.number="item.economicAge"
                    type="number"
                    required
                    min="1"
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
                  />
                </UiFormField>
              </div>

              <!-- Item detail attachments drag, drop & paste zone -->
              <div class="mt-2 border-t border-line/50 pt-3">
                <span class="text-[10px] font-bold text-ink-soft uppercase block mb-1.5">Attachment Detail (Foto Item)</span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                  <!-- Drop/Paste area -->
                  <div
                    tabindex="0"
                    class="border-2 border-dashed border-line hover:border-topbar-1 rounded-lg p-3 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center gap-1 outline-none min-h-[64px]"
                    @click="triggerItemFileBrowser(itemIdx)"
                    @dragover.prevent=""
                    @drop.prevent="handleItemFileDrop($event, itemIdx)"
                    @paste.prevent="handleItemFilePaste($event, itemIdx)"
                  >
                    <Upload class="w-4 h-4 text-ink-soft" />
                    <span class="text-[9px] text-ink font-semibold">Drop / Paste (Ctrl+V) foto</span>
                    <span class="text-[8px] text-ink-soft">JPG, PNG (Maks. 5MB)</span>
                  </div>
                  <!-- Thumbnails -->
                  <div class="sm:col-span-2">
                    <div v-if="!item.images.length" class="text-[10px] text-ink-soft py-4">Belum ada foto detail terlampir.</div>
                    <div v-else class="flex flex-wrap gap-1.5">
                      <div
                        v-for="(detImg, detImgIdx) in item.images"
                        :key="detImgIdx"
                        class="group relative w-12 h-12 rounded border border-line bg-white overflow-hidden flex items-center justify-center shadow-sm cursor-pointer"
                        @click="previewDetailImage(detImg, item.name)"
                        title="Klik untuk preview"
                      >
                        <img :src="getFileUrl(detImg)" class="max-h-full max-w-full object-contain" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye class="w-3.5 h-3.5 text-white" />
                        </div>
                        <button
                          type="button"
                          class="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black text-white p-0.5 rounded-full z-10"
                          @click.stop="removeItemImage(itemIdx, detImgIdx)"
                        >
                          <X class="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Form Submit Actions -->
        <div class="flex justify-end gap-2 my-2">
          <UiButton variant="secondary" type="button" @click="router.push('/hr/asset-request')">Batal</UiButton>
          <UiButton variant="primary" :loading="submitting" @click="onSubmit">Simpan</UiButton>
        </div>
      </div>

      <!-- Right Column: Drag & Drop + Paste Zone & Pricing Info -->
      <div class="lg:col-span-1 flex flex-col gap-4">
        <!-- Master Attachments Drag & Drop Zone -->
        <UiCard class="p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider">
              Master Attachments
            </h2>
          </div>

          <!-- Drag and Drop zone with paste hook -->
          <div
            tabindex="0"
            class="border-2 border-dashed border-line hover:border-topbar-1 rounded-xl p-6 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center gap-2 outline-none"
            :class="{ 'border-topbar-1 bg-[#FFF3EE]': dragOver }"
            @click="triggerFileBrowser"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleFileDrop"
            @paste.prevent="handleFilePaste"
          >
            <Upload class="w-7 h-7 text-ink-soft animate-bounce" />
            <span class="text-[11px] text-ink font-semibold">Klik, drag & drop, atau paste (Ctrl+V)</span>
            <span class="text-[9.5px] text-ink-soft">JPG, PNG, PDF (Maks. 5MB)</span>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              @change="handleFileSelect"
            />
          </div>

          <!-- List of uploaded files -->
          <div v-if="attachments.length > 0" class="mt-4 flex flex-col gap-2">
            <div
              v-for="(file, idx) in attachments"
              :key="file.tempId || file.filePath"
              class="flex items-center justify-between p-2.5 border border-line rounded-lg bg-white shadow-sm"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <FileText v-if="file.mimeType.includes('pdf')" class="w-4 h-4 text-red-500 shrink-0" />
                <ImageIcon v-else class="w-4 h-4 text-blue-500 shrink-0" />
                
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-medium text-ink truncate" :title="file.fileName">{{ file.fileName }}</p>
                  <p class="text-[9.5px] text-ink-soft">
                    {{ file.uploading ? 'Mengunggah...' : formatBytes(file.fileSize) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  v-if="!file.uploading"
                  type="button"
                  class="p-1 rounded text-ink-soft hover:text-ink hover:bg-gray-100"
                  @click="previewAttachment(file)"
                  title="Preview"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50"
                  @click="removeAttachment(idx)"
                  title="Hapus"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Total Price Card summary -->
        <UiCard class="p-5 bg-gray-50 border border-line flex flex-col gap-2">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider text-ink-soft">Ringkasan Harga</h3>
          <div class="flex justify-between items-center border-t border-line pt-2 mt-1">
            <span class="text-xs text-ink-soft">Total Item:</span>
            <span class="text-xs font-semibold text-ink font-mono">{{ form.items.length }} Barang</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-ink-soft">Subtotal Price:</span>
            <span class="text-sm font-bold text-green-600 font-mono">Rp {{ totalPriceCalculated.toLocaleString('id-ID') }}</span>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Hidden input for file details upload -->
    <input
      ref="itemFileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png"
      class="hidden"
      @change="handleItemFileSelect"
    />

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
