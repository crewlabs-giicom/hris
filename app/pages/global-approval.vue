<script setup lang="ts">
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

const activeTab = ref('Approval')

const columns: DataTableColumn[] = [
  { key: 'team', label: 'Team' },
  { key: 'nik', label: 'NIK' },
  { key: 'name', label: 'Nama Karyawan' },
  { key: 'contractEnd', label: 'Kontrak Berakhir' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action', align: 'right' },
]

const rows = [
  { team: 'PISAU', nik: 'SM-26-091', name: 'Nisa Qurrotaayuni', contractEnd: '2026-07-15', status: 'ok' },
  { team: 'MIX-MIX', nik: 'GM-26-332', name: 'Dea Salfia Murdiasari', contractEnd: '2026-07-24', status: 'warn' },
  { team: 'CHAMPION', nik: 'B9-24-107', name: 'Anggar Rully Pratiwi', contractEnd: '2026-07-29', status: 'ok' },
  { team: 'DAYLIGHT', nik: 'SM-25-067', name: 'Nita Aprillia', contractEnd: '2026-08-01', status: 'warn' },
]
</script>

<template>
  <div>
    <UiPageHeader title="Global Approval" breadcrumb="Dashboard / Global Approval" />

    <UiFilterBar>
      <select class="text-xs px-2.5 py-1.5 rounded border border-line bg-white text-ink">
        <option>All Form</option>
      </select>
      <input class="text-xs px-2.5 py-1.5 rounded border border-line bg-white text-ink flex-1 max-w-[280px]" />
    </UiFilterBar>

    <UiCard>
      <UiTabs v-model="activeTab" :tabs="['Approval', 'History']" />

      <div class="flex items-center justify-between px-4 py-2.5 text-[11.5px] text-ink-soft">
        <div class="flex items-center gap-1.5">
          Show
          <select class="border border-line rounded px-1.5 py-0.5 text-[11.5px]">
            <option>10</option>
          </select>
          entries
        </div>
        <div class="flex items-center gap-1.5">
          Search:
          <input class="border border-line rounded px-2 py-0.5 text-[11.5px] w-40" />
        </div>
      </div>

      <UiDataTable :columns="columns" :rows="rows">
        <template #cell-status="{ value }">
          <UiStatusChip
            :variant="value === 'ok' ? 'ok' : 'warn'"
            :label="value === 'ok' ? 'Approved' : 'Waiting Approve'"
          />
        </template>
        <template #cell-action>
          <span class="text-ink-soft">&#8942;</span>
        </template>
      </UiDataTable>

      <UiPagination :from="1" :to="4" :total="25" />
    </UiCard>
  </div>
</template>
