<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Plus, X } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const tabsStore = usePageTabsStore()

const id = Number(route.params.id)
const loading = ref(true)
const saving = ref(false)

const editingAsset = ref<any>({
  id: null,
  name: '',
  purchaseFromDate: '',
  purchaseToDate: '',
  manufactureId: '',
  economicAge: 1,
  condition: 'GOOD',
  price: 0,
  description: '',
  status: 'Active',
  category: 'asset',
  ptId: '',
  location: '',
  roomId: '',
  divisi: '',
  employeeIds: [],
  images: [],
})

const conditionOptions = [
  { id: 'GOOD', label: 'GOOD' },
  { id: 'BAD', label: 'BAD' },
  { id: 'EXCELLENT', label: 'EXCELLENT' },
]

const statusOptions = [
  { id: 'Active', label: 'Active' },
  { id: 'Inactive', label: 'Inactive' },
]

const categoryOptions = [
  { id: 'asuransi', label: 'Asuransi' },
  { id: 'asset', label: 'Asset' },
  { id: 'sewa', label: 'Sewa' },
]

async function fetchDetail() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/assets/${id}`)
    const data = res.data
    editingAsset.value = {
      id: data.id,
      name: data.name,
      purchaseFromDate: data.purchaseFromDate,
      purchaseToDate: data.purchaseToDate,
      manufactureId: String(data.manufactureId),
      economicAge: data.economicAge,
      condition: data.condition,
      price: data.price,
      description: data.description || '',
      status: data.status,
      category: data.category,
      ptId: String(data.ptId),
      location: data.location,
      roomId: String(data.roomId),
      divisi: String(data.divisi),
      employeeIds: data.employees.map((e: any) => String(e.id)),
      images: data.images.map((img: any) => img.attachment),
    }
  } catch (e) {
    toast.error('Gagal mengambil rincian data aset')
    router.push('/hr/asset')
  } finally {
    loading.value = false
  }
}

// File Upload Logic
const fileInput = ref<HTMLInputElement | null>(null)

async function onFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.')
      continue
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await useApi<any>('/api/v1/attachments/upload', {
        method: 'POST',
        body: formData,
      })
      editingAsset.value.images.push(res.data.filePath)
      toast.success(`Foto ${file.name} berhasil diunggah`)
    } catch (err: any) {
      toast.error(err?.data?.statusMessage || 'Gagal mengunggah foto')
    }
  }
  if (fileInput.value) fileInput.value.value = ''
}

function removeImage(idx: number) {
  editingAsset.value.images.splice(idx, 1)
}

async function onSubmitEdit() {
  const f = editingAsset.value
  if (!f.name || !f.purchaseFromDate || !f.purchaseToDate || !f.manufactureId || !f.ptId || !f.roomId || !f.divisi || !f.category) {
    toast.error('Mohon lengkapi semua kolom wajib')
    return
  }

  saving.value = true
  try {
    await useApi(`/api/v1/assets/${id}`, {
      method: 'PUT',
      body: {
        ...f,
        price: Number(f.price) || 0,
      },
    })
    toast.success('Aset berhasil diperbarui!')
    router.push(`/hr/asset/${id}`)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal memperbarui aset')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

// Watch tabs to keep title updated
const pagePath = route.path
watch(
  () => [tabsStore.tabs, editingAsset.value],
  () => {
    const activeTab = tabsStore.tabs.find((t) => t.path === pagePath)
    if (activeTab && editingAsset.value?.name) {
      activeTab.title = `Edit: ${editingAsset.value.name}`
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Edit Informasi Aset" breadcrumb="HR / Assets / Edit">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push(`/hr/asset/${id}`)"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          :disabled="saving || loading"
          @click="onSubmitEdit"
        >
          <Save class="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="py-24 bg-white rounded-xl border border-line flex justify-center items-center my-4">
      <span class="text-xs text-ink-soft animate-pulse">Mengambil rincian data aset...</span>
    </div>

    <div v-else class="my-4">
      <UiCard class="p-6">
        <form @submit.prevent="onSubmitEdit" class="flex flex-col gap-4 max-w-3xl mx-auto">
          <!-- Name -->
          <UiFormField label="Nama Aset" required>
            <input
              v-model="editingAsset.name"
              required
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Purchase From" required>
              <UiDatePicker v-model="editingAsset.purchaseFromDate" />
            </UiFormField>
            <UiFormField label="Purchase To" required>
              <UiDatePicker v-model="editingAsset.purchaseToDate" />
            </UiFormField>
          </div>

          <!-- Manufacture & PT -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Manufacturer" required>
              <UiSelectSearch
                v-model="editingAsset.manufactureId"
                endpoint="/api/v1/master-data/manufacturers"
                placeholder="Pilih Produsen"
              />
            </UiFormField>
            <UiFormField label="PT (Company)" required>
              <UiSelectSearch
                v-model="editingAsset.ptId"
                endpoint="/api/v1/master-data/companies"
                placeholder="Pilih PT"
              />
            </UiFormField>
          </div>

          <!-- Room & Division -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Room" required>
              <UiSelectSearch
                v-model="editingAsset.roomId"
                endpoint="/api/v1/master-data/rooms"
                placeholder="Pilih Ruangan"
              />
            </UiFormField>
            <UiFormField label="Division" required>
              <UiSelectSearch
                v-model="editingAsset.divisi"
                endpoint="/api/v1/master-data/divisions"
                placeholder="Pilih Divisi"
              />
            </UiFormField>
          </div>

          <!-- Economic Age & Price -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Economic Age (Bulan)" required>
              <input
                v-model.number="editingAsset.economicAge"
                type="number"
                required
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              />
            </UiFormField>
            <UiFormField label="Price (Rupiah)" required>
              <input
                v-model="editingAsset.price"
                type="number"
                required
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              />
            </UiFormField>
          </div>

          <!-- Condition & Status -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Condition" required>
              <UiSelectSearch
                v-model="editingAsset.condition"
                :options="conditionOptions"
                placeholder="Pilih Kondisi"
              />
            </UiFormField>
            <UiFormField label="Status" required>
              <UiSelectSearch
                v-model="editingAsset.status"
                :options="statusOptions"
                placeholder="Pilih Status"
              />
            </UiFormField>
          </div>

          <!-- Location & Category -->
          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Location" required>
              <input
                v-model="editingAsset.location"
                required
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              />
            </UiFormField>
            <UiFormField label="Category" required>
              <UiSelectSearch
                v-model="editingAsset.category"
                :options="categoryOptions"
                placeholder="Pilih Kategori"
              />
            </UiFormField>
          </div>

          <!-- Responsible Employees -->
          <UiFormField label="Penanggung Jawab (Employees)">
            <UiSelectSearch
              v-model="editingAsset.employeeIds"
              endpoint="/api/v1/employees"
              placeholder="Pilih Penanggung Jawab"
              :multiple="true"
              labelKey="fullName"
            />
          </UiFormField>

          <!-- Description -->
          <UiFormField label="Description">
            <textarea
              v-model="editingAsset.description"
              rows="3"
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              placeholder="Tulis deskripsi tambahan..."
            ></textarea>
          </UiFormField>

          <!-- Images / Attachment Manager -->
          <div class="border-t border-line pt-4 mt-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold text-ink">Foto Aset</span>
              <button
                type="button"
                class="text-[11px] font-bold text-[#F08050] hover:text-[#E07040] flex items-center gap-1"
                @click="fileInput?.click()"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Unggah Foto</span>
              </button>
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/jpeg,image/png"
                class="hidden"
                @change="onFileSelected"
              />
            </div>
            
            <div v-if="!editingAsset.images.length" class="text-xs text-ink-soft py-2">
              Tidak ada foto terlampir.
            </div>
            <div v-else class="grid grid-cols-4 gap-2">
              <div
                v-for="(img, idx) in editingAsset.images"
                :key="idx"
                class="relative border border-line rounded-lg overflow-hidden h-20 bg-gray-50 flex items-center justify-center shadow-sm"
              >
                <img :src="`/api/v1/attachments/download?file=${encodeURIComponent(img)}`" class="max-h-full max-w-full object-contain" />
                <button
                  type="button"
                  class="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition-all"
                  @click="removeImage(idx)"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </UiCard>
    </div>
  </div>
</template>
