<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Briefcase, FileText } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const router = useRouter()

// Form states
const employeeId = ref('')
const employeeDetail = ref<any>(null)
const loadingDetail = ref(false)

const shiftId = ref('')
const isOff = ref(false)
const adjustmentDate = ref('')

const submitting = ref(false)

// Fetch employee details when selected
watch(employeeId, async (newVal) => {
  if (!newVal) {
    employeeDetail.value = null
    return
  }
  loadingDetail.value = true
  try {
    const res = await useApi<any>(`/api/v1/employees/${newVal}/detail`)
    employeeDetail.value = res.data
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat detail karyawan')
    employeeDetail.value = null
  } finally {
    loadingDetail.value = false
  }
})

async function onSubmit() {
  if (!employeeId.value) {
    toast.error('Harap pilih karyawan')
    return
  }
  if (!adjustmentDate.value) {
    toast.error('Harap pilih tanggal penyesuaian')
    return
  }
  if (!shiftId.value) {
    toast.error('Harap pilih shift')
    return
  }

  submitting.value = true
  try {
    await useApi('/api/v1/shift-schedule/adjustment', {
      method: 'POST',
      body: {
        employeeId: Number(employeeId.value),
        shiftId: Number(shiftId.value),
        isOff: isOff.value,
        adjustmentDate: adjustmentDate.value,
      },
    })
    toast.success('Penyesuaian jadwal berhasil ditambahkan')
    router.push('/hr/shift-schedule/adjustment')
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal menyimpan penyesuaian')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Add Schedule Adjustment" breadcrumb="Dashboard / Shift Schedule / Adjustment / New">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/shift-schedule/adjustment')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke List</span>
        </button>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Main Form Column -->
      <div class="lg:col-span-2">
        <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
          <!-- Form Card -->
          <UiCard class="p-6">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
              <FileText class="w-4 h-4 text-[#F08050]" />
              <span>Detail Informasi Penyesuaian Jadwal</span>
            </h2>

            <div class="flex flex-col gap-4">
              <!-- Select Employee -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Karyawan <span class="text-red-500">*</span></label>
                <UiSelectSearch
                  v-model="employeeId"
                  endpoint="/api/v1/employees"
                  labelKey="fullName"
                  placeholder="Cari & Pilih Karyawan..."
                />
              </div>

              <!-- Read-only Employee Profile Panel -->
              <div v-if="loadingDetail" class="p-4 bg-gray-50 border border-line rounded-xl text-center">
                <span class="text-xs text-ink-soft animate-pulse">Mengambil data profil karyawan...</span>
              </div>
              <div v-else-if="employeeDetail" class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-line text-xs">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Nama Lengkap</span>
                  <span class="font-bold text-ink text-sm">{{ employeeDetail.fullName }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">NIK</span>
                  <span class="font-bold text-ink text-sm">{{ employeeDetail.employeeCode || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Division</span>
                  <span class="font-bold text-ink">{{ employeeDetail.division?.name || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Position</span>
                  <span class="font-bold text-ink">{{ employeeDetail.position?.title || '-' }}</span>
                </div>
              </div>

              <!-- Adjustment Date -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Adjustment Date <span class="text-red-500">*</span></label>
                <UiDatePicker
                  v-model="adjustmentDate"
                  placeholder="Pilih Tanggal Penyesuaian"
                />
              </div>

              <!-- Shift Selector (by Code) -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Shift Code <span class="text-red-500">*</span></label>
                <UiSelectSearch
                  v-model="shiftId"
                  endpoint="/api/v1/master-data/shifts"
                  labelKey="code"
                  placeholder="Pilih Kode Shift..."
                />
              </div>

              <!-- Checkbox Option (Is Off) -->
              <div class="bg-gray-50 p-4 rounded-xl border border-line">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="isOff"
                    class="rounded text-[#F08050] focus:ring-[#F08050] h-4 w-4 border-line"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold text-ink">Is Off?</span>
                    <span class="text-[10px] text-ink-soft">Aktifkan jika penyesuaian ini adalah hari libur (OFF)</span>
                  </div>
                </label>
              </div>
            </div>
          </UiCard>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3">
            <UiButton
              type="button"
              variant="secondary"
              @click="router.push('/hr/shift-schedule/adjustment')"
            >
              Batal
            </UiButton>
            <UiButton
              type="submit"
              variant="primary"
              :loading="submitting"
            >
              <Save class="w-4 h-4 mr-1.5" />
              <span>Simpan Penyesuaian</span>
            </UiButton>
          </div>
        </form>
      </div>

      <!-- Right Column Sidebar / Guide Info -->
      <div class="lg:col-span-1">
        <UiCard class="p-5 border-dashed">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase class="w-4 h-4 text-[#F08050]" />
            <span>Petunjuk Adjustment</span>
          </h3>
          <p class="text-[11px] text-ink-soft leading-relaxed">
            Adjustment Date digunakan untuk melakukan perubahan jadwal shift pada tanggal tertentu saja, yang berbeda dari plotting rutin / fixed schedule.
          </p>
        </UiCard>
      </div>
    </div>
  </div>
</template>
