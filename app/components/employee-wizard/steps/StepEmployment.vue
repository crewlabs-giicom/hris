<script setup lang="ts">
import type { EmploymentForm } from '~/schemas/employee-wizard.schema'

defineProps<{ 
  modelValue: Partial<EmploymentForm>
  errors?: Record<string, string>
  employeeType?: string
}>()
</script>

<template>
  <UiCardForm class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-0">
    <UiFormField label="Perusahaan" :error="errors?.companyId">
      <UiSelectSearch v-model="modelValue.companyId" endpoint="/api/v1/master-data/companies" label-key="name" />
    </UiFormField>

    <UiFormField label="Departemen" :error="errors?.departmentId">
      <UiSelectSearch v-model="modelValue.departmentId" endpoint="/api/v1/master-data/departments" label-key="name" />
    </UiFormField>

    <UiFormField label="Posisi" :error="errors?.positionId">
      <UiSelectSearch v-model="modelValue.positionId" endpoint="/api/v1/master-data/positions" label-key="title" />
    </UiFormField>

    <UiFormField label="Divisi" :error="errors?.divisionId">
      <UiSelectSearch v-model="modelValue.divisionId" endpoint="/api/v1/master-data/divisions" label-key="name" />
    </UiFormField>

    <UiFormField label="Tim" :error="errors?.teamId">
      <UiSelectSearch v-model="modelValue.teamId" endpoint="/api/v1/master-data/teams" label-key="name" />
    </UiFormField>

    <UiFormField label="Tanggal Join" :error="errors?.joinDate">
      <UiDatePicker
        v-model="modelValue.joinDate"
        placeholder="Pilih Tanggal Join"
      />
    </UiFormField>

    <!-- Normal Employee Only Fields -->
    <template v-if="!employeeType || employeeType === 'normal'">
      <UiFormField label="Level Awal" :error="errors?.initialLevelId">
        <UiSelectSearch v-model="modelValue.initialLevelId" endpoint="/api/v1/master-data/levels" label-key="name" />
      </UiFormField>

      <UiFormField label="Kontrak Berakhir" :error="errors?.contractEndDate">
        <UiDatePicker
          v-model="modelValue.contractEndDate"
          placeholder="Pilih Tanggal Kontrak Berakhir"
        />
      </UiFormField>

      <UiFormField label="Dominance (DISC)" :error="errors?.dominance">
        <UiSelectSearch v-model="modelValue.dominance" :options="['D', 'I', 'S', 'C']" />
      </UiFormField>

      <UiFormField label="Tipe BPJS" :error="errors?.bpjsType">
        <UiSelectSearch v-model="modelValue.bpjsType" :options="['TK', 'Kesehatan', 'TK & Kesehatan', 'Tidak Ada']" />
      </UiFormField>

      <UiFormField label="Status Perpajakan" :error="errors?.taxStatus">
        <UiSelectSearch v-model="modelValue.taxStatus" :options="['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']" />
      </UiFormField>
    </template>

    <!-- Freelance Employee Only Fields -->
    <template v-else-if="employeeType === 'freelance'">
      <UiFormField label="Sallary" :error="errors?.gajiPokokEmp">
        <input
          v-model="modelValue.gajiPokokEmp"
          placeholder="Contoh: 5.000.000"
          type="text"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>
    </template>

    <!-- Internship Employee Only Fields -->
    <template v-else-if="employeeType === 'internship'">
      <UiFormField label="Uang Makan" :error="errors?.gajiPokokEmp">
        <input
          v-model="modelValue.gajiPokokEmp"
          placeholder="Contoh: 50.000"
          type="text"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>
    </template>
  </UiCardForm>
</template>
