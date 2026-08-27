<script setup lang="ts">
import type { WizardFormData } from '~/composables/useEmployeeWizard'

const props = defineProps<{
  formData: WizardFormData
  documents: Record<string, { id: string; fileName: string; mimeType: string } | null>
  employeeId?: string | null
  employeeType?: string
}>()

const docLabels: Record<string, string> = { ktp: 'KTP', bpjs: 'BPJS', npwp: 'NPWP', bank_account: 'Rekening' }

const allSectionLabels: Record<string, string> = {
  education: 'Pendidikan',
  family: 'Keluarga',
  'family-tree': 'Susunan Keluarga',
  'emergency-contacts': 'Kontak Darurat',
  'work-experiences': 'Pengalaman Kerja',
  organization: 'Organisasi',
  hobbies: 'Hobi',
  languages: 'Bahasa',
}

const sectionLabels = computed(() => {
  const type = props.employeeType || 'normal'
  if (type === 'freelance') {
    return {
      'emergency-contacts': 'Kontak Darurat',
    }
  }
  if (type === 'internship') {
    return {
      family: 'Keluarga',
      'emergency-contacts': 'Kontak Darurat',
    }
  }
  return allSectionLabels
})

const counts = ref<Record<string, number>>({})
const loadingCounts = ref(false)

async function loadCounts() {
  if (!props.employeeId) return
  loadingCounts.value = true
  try {
    const keys = Object.keys(sectionLabels.value)
    const entries = await Promise.all(
      keys.map(async (key) => {
        const res = await useApi<{ data: unknown[] }>(`/api/v1/employees/${props.employeeId}/${key}`)
        return [key, res.data.length] as const
      })
    )
    counts.value = Object.fromEntries(entries)
  } finally {
    loadingCounts.value = false
  }
}

watch(() => props.employeeId, loadCounts, { immediate: true })
</script>

<template>
  <div>
    <UiCardForm class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Identitas</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div><span class="text-ink-soft">Kode Karyawan:</span> {{ formData.identity.employeeCode || '-' }}</div>
        <div><span class="text-ink-soft">Nama Lengkap:</span> {{ formData.identity.fullName || '-' }}</div>
        <div><span class="text-ink-soft">Email:</span> {{ formData.identity.email || '-' }}</div>
        <div><span class="text-ink-soft">Telepon:</span> {{ formData.identity.phone || '-' }}</div>
        <div><span class="text-ink-soft">NIK:</span> {{ formData.identity.nik || '-' }}</div>
        <div><span class="text-ink-soft">Instagram:</span> {{ formData.identity.instagram || '-' }}</div>
        <div><span class="text-ink-soft">Tiktok:</span> {{ formData.identity.tiktok || '-' }}</div>
      </div>
    </UiCardForm>

    <UiCardForm class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Data Pribadi</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div><span class="text-ink-soft">Tgl Lahir:</span> {{ formData.dataPribadi.birthDate || '-' }}</div>
        <div><span class="text-ink-soft">Jenis Kelamin:</span> {{ formData.dataPribadi.gender || '-' }}</div>
        <div><span class="text-ink-soft">Agama:</span> {{ formData.dataPribadi.religion || '-' }}</div>
        <div><span class="text-ink-soft">Golongan Darah:</span> {{ formData.dataPribadi.bloodType || '-' }}</div>
        <div><span class="text-ink-soft">Status:</span> {{ formData.dataPribadi.maritalStatus || '-' }}</div>
        <div><span class="text-ink-soft">NPWP:</span> {{ formData.dataPribadi.npwp || '-' }}</div>
        <div class="col-span-2"><span class="text-ink-soft">Alamat KTP:</span> {{ formData.dataPribadi.ktpAddress || '-' }}</div>
        <div class="col-span-2"><span class="text-ink-soft">Alamat Domisili:</span> {{ formData.dataPribadi.domicileAddress || '-' }}</div>
        <div><span class="text-ink-soft">Kepemilikan:</span> {{ formData.dataPribadi.domicileOwnership || '-' }}</div>
      </div>
    </UiCardForm>

    <UiCardForm class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Kepegawaian</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div><span class="text-ink-soft">Tanggal Join:</span> {{ formData.employment.joinDate || '-' }}</div>
        <div><span class="text-ink-soft">Perusahaan:</span> {{ formData.employment.companyId ? 'Terpilih' : '-' }}</div>
        <div><span class="text-ink-soft">Departemen:</span> {{ formData.employment.departmentId ? 'Terpilih' : '-' }}</div>
        <div><span class="text-ink-soft">Posisi:</span> {{ formData.employment.positionId ? 'Terpilih' : '-' }}</div>
        <div><span class="text-ink-soft">Divisi:</span> {{ formData.employment.divisionId ? 'Terpilih' : '-' }}</div>
        <div><span class="text-ink-soft">Tim:</span> {{ formData.employment.teamId ? 'Terpilih' : '-' }}</div>
        
        <!-- Normal Employee Only -->
        <template v-if="!employeeType || employeeType === 'normal'">
          <div><span class="text-ink-soft">Level Awal:</span> {{ formData.employment.initialLevelId ? 'Terpilih' : '-' }}</div>
          <div><span class="text-ink-soft">Kontrak Berakhir:</span> {{ formData.employment.contractEndDate || '-' }}</div>
          <div><span class="text-ink-soft">Dominance:</span> {{ formData.employment.dominance || '-' }}</div>
          <div><span class="text-ink-soft">BPJS:</span> {{ formData.employment.bpjsType || '-' }}</div>
          <div><span class="text-ink-soft">Status Pajak:</span> {{ formData.employment.taxStatus || '-' }}</div>
        </template>

        <!-- Freelance Only -->
        <template v-else-if="employeeType === 'freelance'">
          <div><span class="text-ink-soft">Sallary:</span> {{ formData.employment.gajiPokokEmp || '-' }}</div>
        </template>

        <!-- Internship Only -->
        <template v-else-if="employeeType === 'internship'">
          <div><span class="text-ink-soft">Uang Makan:</span> {{ formData.employment.gajiPokokEmp || '-' }}</div>
        </template>
      </div>
    </UiCardForm>

    <!-- Normal Employee Only -->
    <UiCardForm v-if="!employeeType || employeeType === 'normal'" class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Rekening & Pajak</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div><span class="text-ink-soft">Bank:</span> {{ formData.banking.bankId ? 'Terpilih' : '-' }}</div>
        <div><span class="text-ink-soft">No. Rekening:</span> {{ formData.banking.accountNumber || '-' }}</div>
      </div>
    </UiCardForm>

    <UiCardForm class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Dokumen</h4>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(label, type) in docLabels"
          :key="type"
          class="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
          :class="documents[type] ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'"
        >
          {{ label }}: {{ documents[type] ? 'Sudah upload' : 'Belum upload' }}
        </span>
      </div>
    </UiCardForm>

    <UiCardForm class="mb-3">
      <h4 class="text-[12.5px] font-bold text-ink mb-2">Data Lainnya</h4>
      <p v-if="loadingCounts" class="text-[11.5px] text-ink-soft">Memuat ringkasan...</p>
      <div v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="(label, key) in sectionLabels"
          :key="key"
          class="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#FAFAFA] text-ink-soft"
        >
          {{ label }}: {{ counts[key] ?? 0 }}
        </span>
      </div>
      <p class="text-[11px] text-ink-soft mt-2">Semua data di atas sudah tersimpan langsung ke server di step masing-masing.</p>
    </UiCardForm>
  </div>
</template>
