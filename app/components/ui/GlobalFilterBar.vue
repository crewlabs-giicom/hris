<script setup lang="ts">
import { useGlobalFilterStore } from '~/stores/globalFilter'

const props = withDefaults(
  defineProps<{
    showStatus?: boolean
    showPt?: boolean
    showTeam?: boolean
    showPosition?: boolean
    showMonth?: boolean
    showYear?: boolean
  }>(),
  {
    showStatus: true,
    showPt: true,
    showTeam: true,
    showPosition: true,
    showMonth: false,
    showYear: false,
  }
)

const store = useGlobalFilterStore()

const statusOptions = [
  { id: '0', label: 'Deleted' },
  { id: '1', label: 'Active' },
  { id: '2', label: 'Approve HRD' },
  { id: '3', label: 'Approve Leader' },
  { id: '4', label: 'Approve Senior' },
  { id: '5', label: 'Approve PIC' },
  { id: '6', label: 'Rejected' },
  { id: '7', label: 'Approved' },
]

const months = [
  { id: '1', label: 'Januari' },
  { id: '2', label: 'Februari' },
  { id: '3', label: 'Maret' },
  { id: '4', label: 'April' },
  { id: '5', label: 'Mei' },
  { id: '6', label: 'Juni' },
  { id: '7', label: 'Juli' },
  { id: '8', label: 'Agustus' },
  { id: '9', label: 'September' },
  { id: '10', label: 'Oktober' },
  { id: '11', label: 'November' },
  { id: '12', label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => {
  const y = String(currentYear - 5 + i)
  return { id: y, label: y }
})
</script>

<template>
  <!-- Render filters directly inside the parent container so we can wrap them flex-row -->
  <div class="contents">
    <!-- Status Filter -->
    <div v-if="showStatus" class="flex-1 min-w-[150px]">
      <UiSelectSearch
        v-model="store.status"
        :options="statusOptions"
        placeholder="All Status"
      />
    </div>

    <!-- PT (Company) Filter -->
    <div v-if="showPt" class="flex-1 min-w-[150px]">
      <UiSelectSearch
        v-model="store.companyId"
        endpoint="/api/v1/master-data/companies"
        placeholder="All PT"
      />
    </div>

    <!-- Team Filter -->
    <div v-if="showTeam" class="flex-1 min-w-[150px]">
      <UiSelectSearch
        v-model="store.teamId"
        endpoint="/api/v1/master-data/teams"
        placeholder="All Team"
      />
    </div>

    <!-- Position Filter -->
    <div v-if="showPosition" class="flex-1 min-w-[150px]">
      <UiSelectSearch
        v-model="store.positionId"
        endpoint="/api/v1/master-data/positions"
        label-key="title"
        placeholder="All Position"
      />
    </div>

    <!-- Month Filter -->
    <div v-if="showMonth" class="flex-1 min-w-[120px]">
      <UiSelectSearch
        v-model="store.month"
        :options="months"
        placeholder="Select Month"
      />
    </div>

    <!-- Year Filter -->
    <div v-if="showYear" class="flex-1 min-w-[100px]">
      <UiSelectSearch
        v-model="store.year"
        :options="years"
        placeholder="Select Year"
      />
    </div>
  </div>
</template>
