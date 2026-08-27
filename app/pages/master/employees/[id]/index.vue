<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { usePageTabsStore } from '~/stores/pageTabs'
import { 
  User, Mail, Phone, Calendar, Heart, Shield, Award, BookOpen, 
  MapPin, Globe, CreditCard, ChevronRight, Printer, Edit, Trash2, 
  FileText, Activity, AlertCircle, Clock, DollarSign, ArrowLeft
} from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
const employee = ref<any>(null)
const loading = ref(true)
const activeTab = ref('profile')
const tabsStore = usePageTabsStore()

watch(() => employee.value?.fullName, (name) => {
  if (name) {
    const activeTab = tabsStore.tabs.find((t) => t.path === route.path)
    if (activeTab) {
      activeTab.title = name
    }
  }
}, { immediate: true })

const currentDateString = computed(() => {
  const date = new Date()
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
})

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'family', label: 'Family' },
  { id: 'carrier', label: 'Carrier' },
  { id: 'asset', label: 'Asset' },
  { id: 'leave', label: 'Paid Leave' },
  { id: 'ding', label: 'Ding Request' },
  { id: 'salary', label: 'Salary' }
]

// Status label and styles mapping
const statusMap: Record<number, { label: string; badgeClass: string }> = {
  0: { label: 'INACTIVE', badgeClass: 'bg-red-50 text-red-700 border border-red-200' },
  1: { label: 'ACTIVE', badgeClass: 'bg-green-50 text-green-700 border border-green-200' },
  2: { label: 'UNCLEAR', badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200' },
  3: { label: 'FREELANCE', badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200' },
  4: { label: 'INTERNSHIP', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' },
}

async function loadDetail() {
  loading.value = true
  try {
    const res = await useApi<{ data: any }>(`/api/v1/employees/${id}/detail`)
    employee.value = res.data
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal memuat profil karyawan')
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined || amount === '') return '-'
  const val = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(val)) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function triggerPrint() {
  window.print()
}

onMounted(async () => {
  await loadDetail()
  if (route.query.print === 'true') {
    setTimeout(() => {
      window.print()
    }, 1000)
  }
})
</script>

<template>
  <div class="print-container">
    <!-- Header Controls (Hidden in Print) -->
    <div class="flex items-center justify-between mb-4 no-print">
      <div class="flex items-center gap-2">
        <button 
          type="button" 
          class="p-2 bg-white border border-line rounded-lg hover:bg-gray-50 transition-all text-ink shadow-sm"
          @click="navigateTo('/master/employees')"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-base font-bold text-ink">Employee Profile</h1>
          <p class="text-xs text-ink-soft">Master / HR Data / Employee Database / Profile</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="text-xs px-3.5 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="triggerPrint"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Print Profile</span>
        </button>
        <button
          type="button"
          class="text-xs px-3.5 py-2 font-semibold text-ink bg-white border border-line hover:bg-gray-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="navigateTo(`/master/employees/${id}/edit`)"
        >
          <Edit class="w-3.5 h-3.5 text-emerald-500" />
          <span>Edit</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-24 bg-white border border-line rounded-xl shadow-sm no-print">
      <span class="text-sm text-ink-soft animate-pulse">Memuat profil karyawan...</span>
    </div>

    <!-- Main Content -->
    <div v-else-if="employee" class="space-y-5 no-print">
      <!-- 1. User Informations Card -->
      <div class="bg-white rounded-xl shadow-sm border border-line p-5 relative overflow-hidden flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-line bg-gray-50 flex items-center justify-center shrink-0 shadow-inner">
          <img
            :src="employee.photoPath || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=random`"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1 text-center sm:text-left min-w-0">
          <h2 class="text-lg font-bold text-ink mb-1">{{ employee.fullName }}</h2>
          <span 
            v-if="employee.contractEndDate"
            class="inline-block text-[11px] font-bold text-red-600 mb-4"
          >
            Kontak Berakhir: {{ formatDate(employee.contractEndDate) }}
          </span>
          <span 
            v-else
            class="inline-block text-[11px] font-bold text-green-600 mb-4"
          >
            Karyawan Tetap
          </span>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-xs border-t border-dashed border-line pt-3 mt-1">
            <div class="flex flex-col sm:flex-row sm:items-center">
              <span class="text-ink-soft w-28 shrink-0">Username:</span>
              <span class="font-medium text-ink">{{ employee.user?.username || '-' }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center">
              <span class="text-ink-soft w-28 shrink-0">Email:</span>
              <span class="font-medium text-ink break-all">{{ employee.email }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Employee Informations Card -->
      <div class="bg-white rounded-xl shadow-sm border border-line p-5 relative overflow-hidden flex flex-col lg:flex-row gap-6">
        <div class="lg:w-1/3 shrink-0 flex flex-col items-center text-center lg:border-r lg:border-dashed lg:border-line lg:pr-6 pb-4 lg:pb-0">
          <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-line bg-gray-50 flex items-center justify-center shrink-0 mb-3 shadow-inner">
            <img
              :src="employee.photoPath || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=random`"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
          </div>
          <h2 class="text-base font-bold text-ink mb-1">{{ employee.fullName }}</h2>
          <p class="text-[10px] text-ink-soft uppercase leading-snug tracking-wider font-semibold mb-3">
            {{ employee.company?.code || '-' }} - {{ employee.division?.name || '-' }} - {{ employee.position?.title || '-' }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center items-center">
            <span class="text-[11px] px-2 py-0.5 font-bold rounded-lg border bg-gray-50 text-ink border-line">
              NIK: {{ employee.employeeCode }}
            </span>
            <span :class="[statusMap[employee.status]?.badgeClass || 'bg-gray-50 text-ink border-line', 'text-[11px] px-2 py-0.5 font-bold rounded-lg']">
              {{ statusMap[employee.status]?.label || 'ACTIVE' }}
            </span>
          </div>
          <div class="mt-4 text-xs space-y-1.5 text-left w-full border-t border-line pt-3">
            <div class="flex justify-between">
              <span class="text-ink-soft">Level:</span>
              <span class="font-medium text-ink">{{ employee.levelHistories?.[0]?.level?.name || '2.1' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-soft">Tanggal Bergabung:</span>
              <span class="font-medium text-ink">{{ formatDate(employee.joinDate) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-soft">BPJS:</span>
              <span class="font-medium text-ink">{{ employee.bpjsType || 'TK dan KS' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-soft">Status Perpajakan:</span>
              <span class="font-medium text-ink">{{ employee.taxStatus || 'TK/2' }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs self-start">
          <div class="flex flex-col gap-1 border-b border-line pb-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Telp:</span>
            <span class="font-medium text-ink text-sm">{{ employee.phone || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1 border-b border-line pb-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Instagram:</span>
            <span class="font-medium text-ink text-sm">{{ employee.instagram || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1 border-b border-line pb-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Tiktok:</span>
            <span class="font-medium text-ink text-sm">{{ employee.tiktok || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1 border-b border-line pb-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Email:</span>
            <span class="font-medium text-ink text-sm break-all uppercase">{{ employee.email }}</span>
          </div>
          <div class="flex flex-col gap-1 border-b border-line pb-2 md:col-span-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Alamat Domisili:</span>
            <span class="font-medium text-ink text-sm">{{ employee.domicileAddress || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1 border-b border-line pb-2 md:col-span-2">
            <span class="text-ink-soft font-semibold uppercase tracking-wider text-[10px]">Kepemilikan Domisili:</span>
            <span class="font-medium text-ink text-sm">{{ employee.domicileOwnership || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 3. Navigation Tabs (Hidden in Print) -->
      <div class="flex border-b border-line gap-2 overflow-x-auto pb-px no-print">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors"
          :class="activeTab === tab.id ? 'border-[#F08050] text-[#F08050]' : 'border-transparent text-ink-soft hover:text-ink'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 4. Tab Content Area -->
      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile' || route.query.print === 'true'" class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Personal Informations -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <User class="w-4 h-4 text-[#F08050]" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Personal Informations</h3>
          </div>
          <div class="space-y-3 text-xs">
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Nomor KTP:</span>
              <span class="font-medium text-ink">{{ employee.nik || '-' }}</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Telp:</span>
              <span class="font-medium text-ink">{{ employee.phone || '-' }}</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Tgl Lahir:</span>
              <span class="font-medium text-ink">{{ formatDate(employee.birthDate) }}</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Agama:</span>
              <span class="font-medium text-ink capitalize">{{ employee.religion || '-' }}</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Golongan Darah:</span>
              <span class="font-medium text-ink uppercase">{{ employee.bloodType || '-' }}</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-line pb-2">
              <span class="text-ink-soft">Jenis Kelamin:</span>
              <span class="font-medium text-ink capitalize">{{ employee.gender === 'male' ? 'Laki-laki' : employee.gender === 'female' ? 'Perempuan' : '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Kontak Darurat -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <Heart class="w-4 h-4 text-red-500" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Kontak Darurat</h3>
          </div>
          <div v-if="employee.emergencyContacts?.length" class="space-y-4">
            <div 
              v-for="(contact, index) in employee.emergencyContacts" 
              :key="contact.id"
              class="space-y-3 text-xs"
              :class="{ 'border-t border-line pt-3 mt-3': index > 0 }"
            >
              <div class="flex justify-between border-b border-dashed border-line pb-2">
                <span class="text-ink-soft">Nama:</span>
                <span class="font-medium text-ink">{{ contact.name || '-' }}</span>
              </div>
              <div class="flex justify-between border-b border-dashed border-line pb-2">
                <span class="text-ink-soft">Hubungan:</span>
                <span class="font-medium text-ink">{{ contact.relation || '-' }}</span>
              </div>
              <div class="flex justify-between border-b border-dashed border-line pb-2">
                <span class="text-ink-soft">Phone:</span>
                <span class="font-medium text-ink">{{ contact.phone || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-ink-soft">Alamat:</span>
                <span class="font-medium text-ink bg-gray-50 p-2 rounded border border-line">{{ contact.address || '-' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-12 text-ink-soft text-xs">
            <AlertCircle class="w-8 h-8 mb-2 text-gray-300" />
            <span>Belum ada kontak darurat.</span>
          </div>
        </div>

        <!-- Additional Section: Education & Languages -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <BookOpen class="w-4 h-4 text-indigo-500" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Pendidikan</h3>
          </div>
          <div v-if="employee.education?.length" class="space-y-3">
            <div 
              v-for="edu in employee.education" 
              :key="edu.id"
              class="flex justify-between items-center text-xs border-b border-dashed border-line pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p class="font-semibold text-ink">{{ edu.degree || '-' }}</p>
                <p class="text-[11px] text-ink-soft">{{ edu.schoolName || '-' }}</p>
              </div>
              <span class="text-[11px] font-bold text-ink-soft bg-gray-100 px-2 py-0.5 rounded">{{ edu.schoolYear || '-' }}</span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-12 text-ink-soft text-xs">
            <AlertCircle class="w-8 h-8 mb-2 text-gray-300" />
            <span>Belum ada riwayat pendidikan.</span>
          </div>
        </div>

        <!-- Languages & Hobbies -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <Globe class="w-4 h-4 text-emerald-500" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Bahasa & Hobi</h3>
          </div>
          <div class="space-y-4">
            <div>
              <h4 class="font-semibold text-xs text-ink mb-2">Bahasa yang Dikuasai:</h4>
              <div v-if="employee.languages?.length" class="flex flex-wrap gap-2">
                <span 
                  v-for="lang in employee.languages" 
                  :key="lang.id"
                  class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg"
                >
                  {{ lang.language }} ({{ lang.proficiency }})
                </span>
              </div>
              <p v-else class="text-xs text-ink-soft">Tidak ada data bahasa.</p>
            </div>
            
            <div class="border-t border-line pt-3">
              <h4 class="font-semibold text-xs text-ink mb-2">Hobi:</h4>
              <div v-if="employee.hobbies?.length" class="flex flex-wrap gap-2">
                <span 
                  v-for="h in employee.hobbies"
                  :key="h.id"
                  class="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg"
                >
                  {{ h.hobby }}
                </span>
              </div>
              <p v-else class="text-xs text-ink-soft">Tidak ada data hobi.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Family Tab -->
      <div v-if="activeTab === 'family' && route.query.print !== 'true'" class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Family Members -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <User class="w-4 h-4 text-orange-500" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Anggota Keluarga (Pasangan / Anak)</h3>
          </div>
          <div v-if="employee.family?.length" class="space-y-3">
            <div 
              v-for="fam in employee.family" 
              :key="fam.id"
              class="flex justify-between items-center text-xs border-b border-dashed border-line pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p class="font-semibold text-ink">{{ fam.name || '-' }}</p>
                <p class="text-[11px] text-ink-soft capitalize">{{ fam.familyRelation || '-' }}</p>
              </div>
              <span class="text-[11px] text-ink-soft">Lahir: {{ formatDate(fam.birthDate) }}</span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-12 text-ink-soft text-xs">
            <AlertCircle class="w-8 h-8 mb-2 text-gray-300" />
            <span>Belum ada data anggota keluarga.</span>
          </div>
        </div>

        <!-- Family Tree -->
        <div class="bg-white rounded-xl shadow-sm border border-line p-5">
          <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <Award class="w-4 h-4 text-teal-500" />
            <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Susunan Keluarga (Orang Tua / Saudara)</h3>
          </div>
          <div v-if="employee.familyTree?.length" class="space-y-4">
            <div 
              v-for="member in employee.familyTree" 
              :key="member.id"
              class="text-xs border-b border-dashed border-line pb-3 last:border-0 last:pb-0 space-y-1.5"
            >
              <div class="flex justify-between font-semibold">
                <span class="text-ink">{{ member.name || '-' }}</span>
                <span class="text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[10px] uppercase">{{ member.relation || '-' }}</span>
              </div>
              <div class="grid grid-cols-2 gap-y-1 text-[11px] text-ink-soft">
                <div>Lahir: {{ formatDate(member.birthDate) }}</div>
                <div>Gender: {{ member.gender === 'L' ? 'Laki-laki' : member.gender === 'P' ? 'Perempuan' : '-' }}</div>
                <div>Pendidikan: {{ member.lastEducation || '-' }}</div>
                <div>Pekerjaan: {{ member.lastWork || '-' }}</div>
                <div class="col-span-2">Instansi: {{ member.lastInstitute || '-' }}</div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-12 text-ink-soft text-xs">
            <AlertCircle class="w-8 h-8 mb-2 text-gray-300" />
            <span>Belum ada susunan keluarga.</span>
          </div>
        </div>
      </div>

      <!-- Carrier Tab -->
      <div v-if="activeTab === 'carrier' && route.query.print !== 'true'" class="bg-white rounded-xl shadow-sm border border-line p-5">
        <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <Award class="w-4 h-4 text-amber-500" />
          <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Riwayat Level & Jabatan</h3>
        </div>
        <div v-if="employee.levelHistories?.length" class="relative border-l border-line pl-6 ml-2 space-y-6">
          <div 
            v-for="history in employee.levelHistories" 
            :key="history.id"
            class="relative text-xs"
          >
            <!-- Timeline node circle -->
            <div class="absolute -left-[30px] top-0 w-4 h-4 rounded-full border-2 border-[#F08050] bg-white flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-[#F08050]"></div>
            </div>
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-ink text-sm">{{ history.level?.name || 'Level' }}</span>
              <span class="text-[10px] text-ink-soft font-semibold bg-gray-100 px-2 py-0.5 rounded">{{ formatDate(history.effectiveDate) }}</span>
            </div>
            <p class="text-ink-soft text-[11px] italic" v-if="history.note">Note: {{ history.note }}</p>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-12 text-ink-soft text-xs">
          <AlertCircle class="w-8 h-8 mb-2 text-gray-300" />
          <span>Belum ada riwayat level.</span>
        </div>
      </div>

      <!-- Asset Tab -->
      <div v-if="activeTab === 'asset' && route.query.print !== 'true'" class="bg-white rounded-xl shadow-sm border border-line p-5">
        <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <Shield class="w-4 h-4 text-blue-500" />
          <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Assets</h3>
        </div>
        <div class="flex flex-col items-center justify-center py-16 text-ink-soft text-xs border border-dashed border-line rounded-lg">
          <Shield class="w-10 h-10 mb-2 text-gray-300" />
          <span>Belum ada aset yang di-assign ke karyawan ini.</span>
        </div>
      </div>

      <!-- Leave Tab -->
      <div v-if="activeTab === 'leave' && route.query.print !== 'true'" class="bg-white rounded-xl shadow-sm border border-line p-5">
        <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <Clock class="w-4 h-4 text-green-500" />
          <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Leave Balance</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div class="p-4 bg-gray-50 rounded-xl border border-line">
            <p class="text-xs text-ink-soft mb-1 font-semibold uppercase tracking-wider">Total Leave</p>
            <p class="text-2xl font-bold text-ink">12 Hari</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-xl border border-line">
            <p class="text-xs text-ink-soft mb-1 font-semibold uppercase tracking-wider">Used Leave</p>
            <p class="text-2xl font-bold text-ink">12 Hari</p>
          </div>
          <div class="p-4 bg-red-50 rounded-xl border border-red-100">
            <p class="text-xs text-red-600 mb-1 font-semibold uppercase tracking-wider">Remaining Leave</p>
            <p class="text-2xl font-bold text-red-700">0 Hari</p>
          </div>
        </div>
      </div>

      <!-- Ding Request Tab -->
      <div v-if="activeTab === 'ding' && route.query.print !== 'true'" class="bg-white rounded-xl shadow-sm border border-line p-5">
        <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <Activity class="w-4 h-4 text-rose-500" />
          <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Ding Logs / Clock In/Out</h3>
        </div>
        <div class="flex flex-col items-center justify-center py-16 text-ink-soft text-xs border border-dashed border-line rounded-lg">
          <Activity class="w-10 h-10 mb-2 text-gray-300" />
          <span>Belum ada riwayat aktivitas Ding hari ini.</span>
        </div>
      </div>

      <!-- Salary Tab -->
      <div v-if="activeTab === 'salary' && route.query.print !== 'true'" class="bg-white rounded-xl shadow-sm border border-line p-5">
        <div class="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <CreditCard class="w-4 h-4 text-purple-500" />
          <h3 class="font-bold text-xs text-ink uppercase tracking-wider">Informasi Gaji & Bank</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <!-- Gaji Card -->
          <div class="p-4 bg-gray-50 rounded-xl border border-line space-y-3">
            <h4 class="font-bold text-ink border-b border-line pb-2 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-[#F08050]" />
              <span>Gaji Pokok</span>
            </h4>
            <div class="flex justify-between items-center py-1">
              <span class="text-ink-soft font-medium">Gaji Pokok Bulanan:</span>
              <span class="text-base font-bold text-ink">{{ formatCurrency(employee.gajiPokokEmp) }}</span>
            </div>
          </div>
          <!-- Bank Card -->
          <div class="p-4 bg-gray-50 rounded-xl border border-line space-y-3">
            <h4 class="font-bold text-ink border-b border-line pb-2 flex items-center gap-1.5">
              <CreditCard class="w-3.5 h-3.5 text-purple-500" />
              <span>Rekening Bank</span>
            </h4>
            <div class="flex justify-between items-center py-1">
              <span class="text-ink-soft font-medium">Bank Penerima:</span>
              <span class="font-semibold text-ink uppercase">{{ employee.bank?.name || '-' }}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-ink-soft font-medium">Nomor Rekening:</span>
              <span class="font-bold text-ink">{{ employee.accountNumber || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PRINT ONLY VIEW (Matches PDF Reference) -->
    <div v-if="employee" class="hidden print:block print-only-layout text-[9.5px] leading-normal text-black bg-white space-y-4">
      <!-- Print Header -->
      <div class="flex items-center justify-between border-b-2 border-gray-800 pb-1.5 mb-2">
        <!-- Logo -->
        <div class="flex flex-col items-start">
          <div class="flex items-center gap-1.5">
            <svg class="w-6 h-6 text-[#F08050]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
              <path d="M50 35 H75 V60 H50" stroke="currentColor" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            <span class="text-xs font-black tracking-wider text-gray-800">GII COMMERCE</span>
          </div>
        </div>
        <!-- Title -->
        <div class="text-center flex-1">
          <h1 class="text-sm font-bold text-gray-900 tracking-wider">EMPLOYEE DATA FORM</h1>
          <p class="text-[8px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Human Resource Documentation</p>
        </div>
        <!-- Date Info -->
        <div class="text-right text-[8px] text-gray-600">
          <p class="font-semibold text-gray-500">Tanggal Pemberkasan</p>
          <p class="font-bold text-gray-800 mt-0.5">{{ currentDateString }}</p>
        </div>
      </div>

      <!-- DATA PRIBADI -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">DATA PRIBADI</h3>
        <div class="flex gap-4">
          <!-- Left Table (2/3 width) -->
          <div class="flex-1">
            <table class="w-full border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td class="w-1/3 border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Nama</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 font-medium">{{ employee.fullName }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">NIK</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 font-mono">{{ employee.nik || '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Email</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.email }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Phone</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.phone || '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Posisi Dilamar</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.position?.title || '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Tempat / Tgl Lahir</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900">- , {{ formatDate(employee.birthDate) }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Jenis Kelamin</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 capitalize">{{ employee.gender === 'male' ? 'Laki-laki' : employee.gender === 'female' ? 'Perempuan' : '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Agama</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 capitalize">{{ employee.religion || '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Status Pernikahan</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 capitalize">{{ employee.maritalStatus || '-' }}</td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Golongan Darah</td>
                  <td class="border border-gray-300 px-2 py-0.5 text-gray-900 uppercase">{{ employee.bloodType || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Right Photo Container -->
          <div class="w-1/5 shrink-0 flex flex-col items-center justify-center border border-gray-300 p-1 bg-white">
            <div class="w-full aspect-[3/4] overflow-hidden border border-gray-200">
              <img
                :src="employee.photoPath || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=random`"
                alt="Profile Photo"
                class="w-full h-full object-cover animate-fade-in"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ALAMAT -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">ALAMAT</h3>
        <table class="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td class="w-1/4 border border-gray-300 px-2 py-1 bg-gray-50 font-semibold text-gray-700">Alamat KTP</td>
              <td class="border border-gray-300 px-2 py-1 text-gray-900">{{ employee.ktpAddress || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold text-gray-700">Domisili</td>
              <td class="border border-gray-300 px-2 py-1 text-gray-900">{{ employee.domicileAddress || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold text-gray-700">Kepemilikan Domisili</td>
              <td class="border border-gray-300 px-2 py-1 text-gray-900">{{ employee.domicileOwnership || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DATA PEKERJAAN -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">DATA PEKERJAAN</h3>
        <table class="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td class="w-1/4 border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Company</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.company?.name || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Department</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.department?.name || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Division</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.division?.name || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Team</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.team?.name || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Join Date</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ formatDate(employee.joinDate) }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Status Pekerjaan / PKWT</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">
                {{ employee.contractEndDate ? `${formatDate(employee.joinDate)} s.d. ${formatDate(employee.contractEndDate)}` : 'Karyawan Tetap' }}
              </td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Level</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ employee.levelHistories?.[0]?.level?.name || '2.1' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DATA GAJI -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">DATA GAJI</h3>
        <table class="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td class="w-1/4 border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Gaji Pokok</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900 font-bold">{{ formatCurrency(employee.gajiPokokEmp) }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Bank Penerima</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900 uppercase">{{ employee.bank?.name || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Nomor Rekening</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900 font-mono font-bold">{{ employee.accountNumber || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PENDIDIKAN -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">PENDIDIKAN</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700 w-1/4">Degree</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Sekolah / Institusi</th>
              <th class="border border-gray-300 px-2 py-0.5 text-center font-semibold text-gray-700 w-1/4">Tahun</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!employee.education?.length">
              <td colspan="3" class="border border-gray-300 px-2 py-1 text-center text-gray-500 italic">Tidak ada data pendidikan.</td>
            </tr>
            <tr v-else v-for="edu in employee.education" :key="edu.id">
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ edu.degree || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ edu.schoolName || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-center text-gray-900">{{ edu.schoolYear || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PENGALAMAN KERJA -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">PENGALAMAN KERJA</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Perusahaan</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Posisi</th>
              <th class="border border-gray-300 px-2 py-0.5 text-center font-semibold text-gray-700">Lama Kerja</th>
              <th class="border border-gray-300 px-2 py-0.5 text-right font-semibold text-gray-700">Gaji</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Alasan Resign</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!employee.workExperiences?.length">
              <td colspan="5" class="border border-gray-300 px-2 py-1 text-center text-gray-500 italic">Tidak ada data pengalaman kerja.</td>
            </tr>
            <tr v-else v-for="work in employee.workExperiences" :key="work.id">
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ work.companyName || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ work.workPosition || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-center text-gray-900">{{ work.workLength || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-right text-gray-900">{{ formatCurrency(work.salaryPerMonth) }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ work.reasonForLeaving || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DATA KELUARGA -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">DATA KELUARGA</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Nama</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Hubungan</th>
              <th class="border border-gray-300 px-2 py-0.5 text-center font-semibold text-gray-700">Tanggal Lahir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!employee.family?.length && !employee.familyTree?.length">
              <td colspan="3" class="border border-gray-300 px-2 py-1 text-center text-gray-500 italic">Tidak ada data keluarga.</td>
            </tr>
            <template v-else>
              <tr v-for="fam in employee.family" :key="fam.id">
                <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ fam.name || '-' }}</td>
                <td class="border border-gray-300 px-2 py-0.5 text-gray-900 uppercase font-semibold text-orange-600">{{ fam.familyRelation || '-' }}</td>
                <td class="border border-gray-300 px-2 py-0.5 text-center text-gray-900">{{ formatDate(fam.birthDate) }}</td>
              </tr>
              <tr v-for="member in employee.familyTree" :key="member.id">
                <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ member.name || '-' }}</td>
                <td class="border border-gray-300 px-2 py-0.5 text-gray-900 uppercase font-semibold text-teal-600">{{ member.relation || '-' }}</td>
                <td class="border border-gray-300 px-2 py-0.5 text-center text-gray-900">{{ formatDate(member.birthDate) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- EMERGENCY CONTACT -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">EMERGENCY CONTACT</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Nama</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Hubungan</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Phone</th>
              <th class="border border-gray-300 px-2 py-0.5 text-left font-semibold text-gray-700">Alamat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!employee.emergencyContacts?.length">
              <td colspan="4" class="border border-gray-300 px-2 py-1 text-center text-gray-500 italic">Tidak ada kontak darurat.</td>
            </tr>
            <tr v-else v-for="contact in employee.emergencyContacts" :key="contact.id">
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ contact.name || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900 font-medium">{{ contact.relation || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ contact.phone || '-' }}</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">{{ contact.address || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- INFORMASI TAMBAHAN -->
      <div>
        <h3 class="text-[10px] font-bold text-gray-900 tracking-wider uppercase border-b border-gray-800 pb-0.5 mb-1.5">INFORMASI TAMBAHAN</h3>
        <table class="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td class="w-1/4 border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Instagram</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">@{{ employee.instagram || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Tiktok</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">@{{ employee.tiktok || '-' }}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Hobby</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">
                <span v-for="(h, index) in employee.hobbies" :key="h.id">
                  {{ h.hobby }}{{ index < employee.hobbies.length - 1 ? ', ' : '' }}
                </span>
                <span v-if="!employee.hobbies?.length">-</span>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold text-gray-700">Bahasa yang Dikuasai</td>
              <td class="border border-gray-300 px-2 py-0.5 text-gray-900">
                <span v-for="(lang, index) in employee.languages" :key="lang.id">
                  {{ lang.language }} ({{ lang.proficiency }}){{ index < employee.languages.length - 1 ? ', ' : '' }}
                </span>
                <span v-if="!employee.languages?.length">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
  .print-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
  .print-only-layout {
    display: block !important;
  }
  .print-only-layout h3 {
    page-break-after: avoid;
  }
  .print-only-layout tr, .print-only-layout table {
    page-break-inside: avoid;
  }
}
</style>
