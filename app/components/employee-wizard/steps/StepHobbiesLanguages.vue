<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { LanguageItem } from '~/schemas/employee-wizard.schema'

const props = defineProps<{ employeeId?: string | null }>()

const hobbies = ref<string[]>([])
const newHobby = ref('')
const languages = ref<LanguageItem[]>([])
const loading = ref(false)
const savingHobbies = ref(false)
const savingLanguages = ref(false)

const inputClass =
  'w-full text-[12.5px] px-2.5 py-1.5 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1'

async function load() {
  if (!props.employeeId) return
  loading.value = true
  try {
    const [hobbiesRes, languagesRes] = await Promise.all([
      useApi<{ data: { hobby: string }[] }>(`/api/v1/employees/${props.employeeId}/hobbies`),
      useApi<{ data: LanguageItem[] }>(`/api/v1/employees/${props.employeeId}/languages`),
    ])
    hobbies.value = hobbiesRes.data.map((h) => h.hobby)
    languages.value = languagesRes.data.map((l) => ({ language: l.language, proficiency: l.proficiency }))
  } finally {
    loading.value = false
  }
}

async function saveHobbies() {
  if (!props.employeeId) return
  savingHobbies.value = true
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/hobbies`, { method: 'PUT', body: { hobbies: hobbies.value } })
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan hobi')
  } finally {
    savingHobbies.value = false
  }
}

function addHobby() {
  const value = newHobby.value.trim()
  if (!value) return
  hobbies.value.push(value)
  newHobby.value = ''
  saveHobbies()
}

function removeHobby(index: number) {
  hobbies.value.splice(index, 1)
  saveHobbies()
}

async function saveLanguages() {
  if (!props.employeeId) return
  savingLanguages.value = true
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/languages`, {
      method: 'PUT',
      body: { languages: languages.value.filter((l) => l.language && l.proficiency) },
    })
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan bahasa')
  } finally {
    savingLanguages.value = false
  }
}

function addLanguage() {
  languages.value.push({ language: '', proficiency: '' })
}

function removeLanguage(index: number) {
  languages.value.splice(index, 1)
  saveLanguages()
}

watch(() => props.employeeId, load, { immediate: true })
</script>

<template>
  <div class="space-y-3">
    <UiCardForm>
      <h4 class="text-[12.5px] font-bold text-ink mb-3">Hobi</h4>
      <p v-if="!employeeId" class="text-[11px] text-ink-soft mb-3">
        Isi step Identitas dan klik Lanjut dulu supaya Hobi bisa diisi.
      </p>
      <div class="flex flex-wrap gap-1.5 mb-3">
        <span
          v-for="(hobby, i) in hobbies"
          :key="i"
          class="inline-flex items-center gap-1 bg-[#FFF3EE] text-topbar-1 text-[11px] font-semibold px-2 py-1 rounded-full"
        >
          {{ hobby }}
          <button type="button" class="leading-none" @click="removeHobby(i)">&#10005;</button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newHobby"
          :disabled="!employeeId"
          placeholder="Tambah hobi, tekan Enter"
          :class="inputClass"
          @keydown.enter.prevent="addHobby"
        />
        <UiButton type="button" variant="secondary" :disabled="!employeeId" @click="addHobby">Tambah</UiButton>
      </div>
    </UiCardForm>

    <UiCardForm>
      <h4 class="text-[12.5px] font-bold text-ink mb-3">Bahasa</h4>
      <div v-for="(lang, i) in languages" :key="i" class="flex items-center gap-2 mb-2">
        <input v-model="lang.language" placeholder="Bahasa" :class="inputClass" class="flex-1 min-w-0" @blur="saveLanguages" />
        <div class="w-44 shrink-0">
          <UiSelectSearch
            v-model="lang.proficiency"
            placeholder="Penguasaan"
            :options="['Dasar', 'Menengah', 'Mahir']"
            @update:model-value="saveLanguages"
          />
        </div>
        <button type="button" class="text-ink-soft hover:text-red-600 text-xs shrink-0" @click="removeLanguage(i)">&#10005;</button>
      </div>
      <UiButton type="button" variant="secondary" :disabled="!employeeId" @click="addLanguage">+ Tambah Bahasa</UiButton>
    </UiCardForm>
  </div>
</template>
