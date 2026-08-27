import { defineStore } from 'pinia'
import type { IdentityForm, DataPribadiForm, EmploymentForm, BankingForm } from '~/schemas/employee-wizard.schema'

export const WIZARD_FORM_VERSION = 3

// Education, Family, Family Tree, Emergency Contact, Work Experience, Organization, Hobbies,
// and Languages are no longer part of this store — each of those steps is fully server-backed
// (fetches/saves its own rows via useApi once employeeId exists), so there's nothing left to
// keep in local draft state for them. Only the four PUT-per-step forms live here.
export interface WizardFormData {
  identity: Partial<IdentityForm>
  dataPribadi: Partial<DataPribadiForm>
  employment: Partial<EmploymentForm>
  banking: Partial<BankingForm>
}

function emptyFormData(): WizardFormData {
  return {
    identity: { status: 1 },
    dataPribadi: {},
    employment: { gajiPokokEmp: '' },
    banking: {},
  }
}

/**
 * One Pinia store instance per mode/employeeId, so a create draft and an edit(id=5) draft
 * never collide in localStorage, and editing two different employees in two tabs stays isolated.
 *
 * `employeeId` is writable state (not just the constructor arg) because create mode now
 * auto-creates the employee right after the Identity step (see WizardLayout.vue) — the id
 * only becomes known partway through the wizard, not at store-creation time.
 */
export function useEmployeeWizard(mode: 'create' | 'edit', employeeId?: string) {
  const storeId = mode === 'edit' ? `employee-wizard-edit-${employeeId}` : 'employee-wizard-create'

  const useStore = defineStore(storeId, {
    state: () => ({
      mode,
      employeeId: employeeId ?? (null as string | null),
      currentStep: 0,
      formVersion: WIZARD_FORM_VERSION,
      lastSavedAt: null as string | null,
      formData: emptyFormData(),
    }),
    actions: {
      goNext(lastStepIndex: number) {
        if (this.currentStep < lastStepIndex) this.currentStep++
      },
      goPrev() {
        if (this.currentStep > 0) this.currentStep--
      },
      goToStep(i: number) {
        this.currentStep = i
      },
      setEmployeeId(id: string) {
        this.employeeId = id
      },
      hydrateFromServer(employee: Record<string, any>) {
        this.formData.identity = {
          employeeCode: employee.employeeCode ?? '',
          fullName: employee.fullName ?? '',
          email: employee.email ?? '',
          phone: employee.phone ?? '',
          nik: employee.nik ?? '',
          instagram: employee.instagram ?? '',
          tiktok: employee.tiktok ?? '',
          status: employee.status ?? 1,
        }
        this.formData.dataPribadi = {
          birthDate: employee.birthDate ? String(employee.birthDate).slice(0, 10) : '',
          religion: employee.religion ?? '',
          bloodType: employee.bloodType ?? '',
          gender: employee.gender ?? '',
          maritalStatus: employee.maritalStatus ?? '',
          ktpAddress: employee.ktpAddress ?? '',
          npwp: employee.npwp ?? '',
          domicileAddress: employee.domicileAddress ?? '',
          domicileOwnership: employee.domicileOwnership ?? '',
        }
        this.formData.employment = {
          companyId: employee.companyId ?? '',
          departmentId: employee.departmentId ?? '',
          positionId: employee.positionId ?? '',
          divisionId: employee.divisionId ?? '',
          teamId: employee.teamId ?? '',
          joinDate: employee.joinDate ? String(employee.joinDate).slice(0, 10) : '',
          contractEndDate: employee.contractEndDate ? String(employee.contractEndDate).slice(0, 10) : '',
          dominance: employee.dominance ?? '',
          bpjsType: employee.bpjsType ?? '',
          taxStatus: employee.taxStatus ?? '',
          gajiPokokEmp: employee.gajiPokokEmp ?? '',
        }
        this.formData.banking = {
          bankId: employee.bankId ?? '',
          accountNumber: employee.accountNumber ?? '',
        }
      },
      resetDraft() {
        // $reset() changes formData/currentStep/employeeId, which is exactly what the
        // persistence watcher below listens for — without this guard it would immediately
        // re-stamp lastSavedAt on the now-empty state, making a just-discarded draft look
        // like one that was "just saved" (and the draft-resume banner would wrongly reappear).
        ;(this as any).__suppressNextPersist = true
        this.$reset()
        if (import.meta.client) localStorage.removeItem(storeId)
      },
    },
  })

  const store = useStore()

  // Manual localStorage persistence, scoped to this storeId. Tried the
  // pinia-plugin-persistedstate package first, but its store.$subscribe hook never fired
  // against @pinia/nuxt 0.5.x in this project (localStorage stayed empty on every check) —
  // this plain watch is simpler to reason about and verified working end-to-end.
  if (import.meta.client) {
    if (!(store as any).__wizardPersistenceWired) {
      const raw = localStorage.getItem(storeId)
      if (raw) {
        try {
          store.$patch(JSON.parse(raw))
        } catch {
          localStorage.removeItem(storeId)
        }
      }
      // Watch formData/currentStep/employeeId specifically (not the whole $state) so setting
      // lastSavedAt inside the callback doesn't re-trigger itself.
      watch(
        () => JSON.stringify({ formData: store.formData, currentStep: store.currentStep, employeeId: store.employeeId }),
        () => {
          if ((store as any).__suppressNextPersist) {
            ;(store as any).__suppressNextPersist = false
            return
          }
          store.lastSavedAt = new Date().toISOString()
          localStorage.setItem(storeId, JSON.stringify(store.$state))
        }
      )
      // Pinia caches the store instance by id, so this block must only run once per id —
      // guard against re-wiring a second watcher on a subsequent useEmployeeWizard() call.
      ;(store as any).__wizardPersistenceWired = true
    }
  }

  return store
}
