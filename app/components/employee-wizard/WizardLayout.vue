<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  identitySchema,
  dataPribadiSchema,
  employmentSchema,
  bankingSchema,
} from '~/schemas/employee-wizard.schema'
import { WIZARD_FORM_VERSION } from '~/composables/useEmployeeWizard'

const props = defineProps<{ mode: 'create' | 'edit'; employeeId?: string }>()

const wizard = useEmployeeWizard(props.mode, props.employeeId)
const { confirm } = useConfirm()
const route = useRoute()

// Determine employee type: normal, freelance, or internship
const employeeType = computed(() => {
  if (props.mode === 'create') {
    const qType = route.query.type as string
    if (qType === 'freelance' || qType === 'internship') return qType
    return 'normal'
  } else {
    const status = wizard.formData.identity.status
    if (status === 3) return 'freelance'
    if (status === 4) return 'internship'
    return 'normal'
  }
})

// Dynamic list of steps based on employee type
const steps = computed(() => {
  const type = employeeType.value
  if (type === 'freelance') {
    return [
      { key: 'identity', label: 'Identitas', schema: identitySchema, payloadKey: 'identity' },
      { key: 'dataPribadi', label: 'Data Pribadi', schema: dataPribadiSchema, payloadKey: 'dataPribadi' },
      { key: 'employment', label: 'Kepegawaian', schema: employmentSchema, payloadKey: 'employment' },
      { key: 'emergencyContacts', label: 'Kontak Darurat', schema: null, payloadKey: null },
      { key: 'review', label: 'Review', schema: null, payloadKey: null },
    ]
  }
  if (type === 'internship') {
    return [
      { key: 'identity', label: 'Identitas', schema: identitySchema, payloadKey: 'identity' },
      { key: 'dataPribadi', label: 'Data Pribadi', schema: dataPribadiSchema, payloadKey: 'dataPribadi' },
      { key: 'employment', label: 'Kepegawaian', schema: employmentSchema, payloadKey: 'employment' },
      { key: 'family', label: 'Keluarga', schema: null, payloadKey: null },
      { key: 'emergencyContacts', label: 'Kontak Darurat', schema: null, payloadKey: null },
      { key: 'review', label: 'Review', schema: null, payloadKey: null },
    ]
  }
  // Normal Employee
  return [
    { key: 'identity', label: 'Identitas', schema: identitySchema, payloadKey: 'identity' },
    { key: 'dataPribadi', label: 'Data Pribadi', schema: dataPribadiSchema, payloadKey: 'dataPribadi' },
    { key: 'employment', label: 'Kepegawaian', schema: employmentSchema, payloadKey: 'employment' },
    { key: 'banking', label: 'Rekening & Pajak', schema: bankingSchema, payloadKey: 'banking' },
    { key: 'education', label: 'Pendidikan', schema: null, payloadKey: null },
    { key: 'family', label: 'Keluarga', schema: null, payloadKey: null },
    { key: 'familyTree', label: 'Susunan Keluarga', schema: null, payloadKey: null },
    { key: 'emergencyContacts', label: 'Kontak Darurat', schema: null, payloadKey: null },
    { key: 'workExperiences', label: 'Pengalaman Kerja', schema: null, payloadKey: null },
    { key: 'organization', label: 'Organisasi', schema: null, payloadKey: null },
    { key: 'hobbiesLanguages', label: 'Hobi & Bahasa', schema: null, payloadKey: null },
    { key: 'review', label: 'Review', schema: null, payloadKey: null },
  ]
})

const lastStepIndex = computed(() => steps.value.length - 1)
const currentStepKey = computed(() => steps.value[wizard.currentStep]?.key)

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const loadingServer = ref(false)
const showDraftBanner = ref(false)
const savingIndicator = ref<'idle' | 'saving' | 'saved'>('idle')
const documents = ref<Record<string, { id: string; fileName: string; mimeType: string } | null>>({
  ktp: null,
  bpjs: null,
  npwp: null,
  bank_account: null,
})
const hasPhoto = ref(false)
const identityStepRef = ref<{ flushPendingPhoto: (endpoint: string) => Promise<boolean> } | null>(null)

async function loadFromServer() {
  if (!wizard.employeeId) return
  loadingServer.value = true
  try {
    const res = await useApi<{ data: Record<string, any> }>(`/api/v1/employees/${wizard.employeeId}/detail`)
    hasPhoto.value = !!res.data.photoPath
    if (!wizard.lastSavedAt) {
      wizard.hydrateFromServer(res.data)
    }
    return res.data
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.response?.status === 404) {
      console.warn('[employee-wizard] draft points at a missing employee, discarding it')
      wizard.resetDraft()
    }
    return undefined
  } finally {
    loadingServer.value = false
  }
}

async function loadDocuments() {
  if (!wizard.employeeId) return
  try {
    const res = await useApi<{ data: Array<{ id: string; documentType: string; fileName: string; mimeType: string }> }>(
      `/api/v1/employees/${wizard.employeeId}/documents`
    )
    const map: typeof documents.value = { ktp: null, bpjs: null, npwp: null, bank_account: null }
    for (const doc of res.data) map[doc.documentType] = doc
    documents.value = map
  } catch {
    // Non-fatal — document list just stays empty; the upload slots still work standalone.
  }
}

watch(
  () => wizard.employeeId,
  (id) => {
    if (id) loadDocuments()
  },
  { immediate: true }
)

onMounted(async () => {
  const hadDraftBeforeLoad = !!wizard.lastSavedAt && wizard.formVersion === WIZARD_FORM_VERSION
  await loadFromServer()

  if (wizard.formVersion !== WIZARD_FORM_VERSION) {
    // Schema changed since this draft was saved — discard silently.
    console.warn('[employee-wizard] draft formVersion mismatch, discarding stale draft')
    wizard.resetDraft()
    await loadFromServer()
    return
  }

  // loadFromServer() may have discarded the draft itself (e.g. it pointed at a deleted
  // employee) — only offer to resume if there's actually still something to resume.
  if (hadDraftBeforeLoad && wizard.lastSavedAt) {
    showDraftBanner.value = true
  }

  // Set initial status default on create
  if (props.mode === 'create' && !wizard.employeeId) {
    if (employeeType.value === 'freelance') {
      wizard.formData.identity.status = 3
    } else if (employeeType.value === 'internship') {
      wizard.formData.identity.status = 4
    } else {
      wizard.formData.identity.status = 1
    }
  }
})

// Debounced "saved" indicator whenever the store persists a change.
watch(
  () => wizard.lastSavedAt,
  (val) => {
    if (!val) return
    savingIndicator.value = 'saved'
  }
)

function onDiscardDraft() {
  wizard.resetDraft()
  loadFromServer()
  showDraftBanner.value = false
}

function onResumeDraft() {
  showDraftBanner.value = false
}

function validateCurrentStep(): boolean {
  const step = steps.value[wizard.currentStep]
  errors.value = {}
  if (!step.schema) return true

  const data = (wizard.formData as any)[step.key]
  const result = step.schema.safeParse(data)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.value[String(issue.path[0])] = issue.message
    }
    return false
  }
  return true
}

function cleanPayload(data: Record<string, any>) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== undefined))
}

/** Ensures the employee_level_histories row exists exactly once, the first time Employment is saved with a level chosen. */
async function ensureInitialLevelHistory() {
  if (!wizard.employeeId) return
  const employment = wizard.formData.employment
  // Freelance and Internship do not use initialLevelId
  if (employeeType.value !== 'normal') return
  if (!employment.initialLevelId || !employment.joinDate) return

  const existing = await useApi<{ data: unknown[] }>(`/api/v1/employees/${wizard.employeeId}/level-histories`)
  if (existing.data.length) return

  await useApi(`/api/v1/employees/${wizard.employeeId}/level-histories`, {
    method: 'POST',
    body: { levelId: employment.initialLevelId, effectiveDate: employment.joinDate, note: 'Initial level on hire' },
  })
}

/** Builds the payload for a given step's PUT/POST — `nik` is a special case: it's stored on
 * `formData.identity` (that's still the real employees.nik column) but rendered on the Data
 * Pribadi step's UI, not Identity's. So it must be excluded from the Identity step's payload
 * (sending it there while the field isn't even visible on this step made a stale/duplicate NIK
 * value block the user with no way to see or fix it) and included in Data Pribadi's instead. */
function buildStepPayload(step: any): Record<string, any> {
  if (step.key === 'identity') {
    const { nik, ...rest } = wizard.formData.identity as Record<string, any>
    const statusVal = employeeType.value === 'freelance' ? 3 : employeeType.value === 'internship' ? 4 : 1
    return cleanPayload({ ...rest, status: statusVal })
  }
  if (step.key === 'dataPribadi') {
    return cleanPayload({ ...wizard.formData.dataPribadi, nik: wizard.formData.identity.nik })
  }
  return cleanPayload((wizard.formData as any)[step.payloadKey as string])
}

/** Persists the current step's data to the server — auto-creating the employee on the very
 * first step in create mode, PUTting for every step after that. Returns false (and leaves
 * the wizard on the current step) if the save fails. */
async function persistCurrentStep(): Promise<boolean> {
  const step = steps.value[wizard.currentStep]
  if (!step.payloadKey) return true

  submitting.value = true
  try {
    const payload = buildStepPayload(step)

    if (!wizard.employeeId) {
      // First save in create mode — this is always the Identity step, since it's step 0
      // and every later step requires wizard.employeeId to already exist.
      const res = await useApi<{ data: { id: string } }>('/api/v1/employees', { method: 'POST', body: payload })
      wizard.setEmployeeId(res.data.id)
      // Must happen here, synchronously before the caller advances the step — once currentStep
      // changes, StepIdentity (and the pending photo file living inside its FileUploadSlot)
      // unmounts before the endpoint prop update would otherwise reach it.
      const photoUploaded = await identityStepRef.value?.flushPendingPhoto(`/api/v1/employees/${res.data.id}/photo`)
      if (photoUploaded) hasPhoto.value = true
      return true
    }

    await useApi(`/api/v1/employees/${wizard.employeeId}`, { method: 'PUT', body: payload })

    if (step.key === 'employment') {
      await ensureInitialLevelHistory()
    }
    return true
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan data')
    return false
  } finally {
    submitting.value = false
  }
}

async function handleNext() {
  if (!validateCurrentStep()) return
  const ok = await persistCurrentStep()
  if (!ok) return
  wizard.goNext(lastStepIndex.value)
}

function handlePrev() {
  errors.value = {}
  wizard.goPrev()
}

function goToStep(i: number) {
  errors.value = {}
  wizard.goToStep(i)
}

async function handleDiscardWizard() {
  const employeeExists = !!wizard.employeeId
  const ok = await confirm({
    title: 'Buang draft ini?',
    text: employeeExists
      ? 'Employee yang sudah tersimpan di server akan ikut dihapus.'
      : 'Semua data yang sudah diisi di form ini akan hilang.',
    confirmText: 'Buang',
    danger: true,
  })
  if (!ok) return

  if (employeeExists && props.mode === 'create') {
    try {
      await useApi(`/api/v1/employees/${wizard.employeeId}`, { method: 'DELETE' })
    } catch (e: any) {
      toast.error(e?.data?.statusMessage || 'Gagal menghapus employee')
      return
    }
  }
  wizard.resetDraft()
  await navigateTo('/master/employees')
}

function handleOcrResult(payload: Record<string, any>) {
  if (payload.nik) wizard.formData.identity.nik = payload.nik
  if (payload.fullName && !wizard.formData.identity.fullName) wizard.formData.identity.fullName = payload.fullName
  if (payload.birthDate) wizard.formData.dataPribadi.birthDate = payload.birthDate
  if (payload.religion) wizard.formData.dataPribadi.religion = payload.religion
  if (payload.maritalStatus) wizard.formData.dataPribadi.maritalStatus = payload.maritalStatus
  if (payload.gender) wizard.formData.dataPribadi.gender = payload.gender
  if (payload.bloodType) wizard.formData.dataPribadi.bloodType = payload.bloodType
  if (payload.ktpAddress) wizard.formData.dataPribadi.ktpAddress = payload.ktpAddress
  toast.success('Data dari KTP terisi otomatis — mohon periksa kembali sebelum lanjut.')
}

function handleDocumentSaved(type: string, doc: any) {
  documents.value[type] = doc
}

function handlePhotoUploaded() {
  hasPhoto.value = true
}

async function handleFinish() {
  submitting.value = true
  try {
    wizard.resetDraft()
    toast.success(props.mode === 'edit' ? 'Data karyawan berhasil diperbarui' : 'Karyawan baru berhasil dibuat')
    await navigateTo('/master/employees')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <EmployeeWizardDraftBanner
      v-if="showDraftBanner"
      :last-saved-at="wizard.lastSavedAt"
      @resume="onResumeDraft"
      @discard="onDiscardDraft"
    />

    <EmployeeWizardStepper
      :steps="steps.map((s) => ({ key: s.key, label: s.label }))"
      :current-step="wizard.currentStep"
      :saving-indicator="savingIndicator"
      :last-saved-at="wizard.lastSavedAt"
      @go-to-step="goToStep"
    />

    <UiCard>
      <div class="p-4">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-x-2"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div :key="wizard.currentStep">
            <EmployeeWizardStepsStepIdentity
              v-if="currentStepKey === 'identity'"
              ref="identityStepRef"
              :model-value="wizard.formData.identity"
              :errors="errors"
              :employee-id="wizard.employeeId"
              :has-photo="hasPhoto"
              @photo-uploaded="handlePhotoUploaded"
            />
            <EmployeeWizardStepsStepDataPribadi
              v-else-if="currentStepKey === 'dataPribadi'"
              :model-value="wizard.formData.dataPribadi"
              :identity="wizard.formData.identity"
              :errors="errors"
              :employee-id="wizard.employeeId"
              :documents="documents"
              @ocr-result="handleOcrResult"
              @document-saved="handleDocumentSaved"
            />
            <EmployeeWizardStepsStepEmployment
              v-else-if="currentStepKey === 'employment'"
              :model-value="wizard.formData.employment"
              :errors="errors"
              :employee-type="employeeType"
            />
            <EmployeeWizardStepsStepBanking
              v-else-if="currentStepKey === 'banking'"
              :model-value="wizard.formData.banking"
              :errors="errors"
              :employee-id="wizard.employeeId"
              :documents="documents"
              @document-saved="handleDocumentSaved"
            />
            <EmployeeWizardStepsStepEducation v-else-if="currentStepKey === 'education'" :employee-id="wizard.employeeId" />
            <EmployeeWizardStepsStepFamily v-else-if="currentStepKey === 'family'" :employee-id="wizard.employeeId" />
            <EmployeeWizardStepsStepFamilyTree v-else-if="currentStepKey === 'familyTree'" :employee-id="wizard.employeeId" />
            <EmployeeWizardStepsStepEmergencyContact
              v-else-if="currentStepKey === 'emergencyContacts'"
              :employee-id="wizard.employeeId"
            />
            <EmployeeWizardStepsStepWorkExperience
              v-else-if="currentStepKey === 'workExperiences'"
              :employee-id="wizard.employeeId"
            />
            <EmployeeWizardStepsStepOrganization
              v-else-if="currentStepKey === 'organization'"
              :employee-id="wizard.employeeId"
            />
            <EmployeeWizardStepsStepHobbiesLanguages v-else-if="currentStepKey === 'hobbiesLanguages'" :employee-id="wizard.employeeId" />
            <EmployeeWizardStepsStepReview
              v-else-if="currentStepKey === 'review'"
              :form-data="wizard.formData"
              :documents="documents"
              :employee-id="wizard.employeeId"
              :employee-type="employeeType"
            />
          </div>
        </Transition>
      </div>

      <div class="flex items-center justify-between px-4 py-3 border-t border-line">
        <UiButton variant="secondary" @click="handleDiscardWizard">Buang Draft</UiButton>
        <div class="flex items-center gap-2">
          <UiButton v-if="wizard.currentStep > 0" variant="secondary" @click="handlePrev">Kembali</UiButton>
          <UiButton v-if="wizard.currentStep < lastStepIndex" variant="primary" :loading="submitting" @click="handleNext">
            Lanjut
          </UiButton>
          <UiButton v-else variant="primary" :loading="submitting" @click="handleFinish">Selesai</UiButton>
        </div>
      </div>
    </UiCard>
  </div>
</template>
