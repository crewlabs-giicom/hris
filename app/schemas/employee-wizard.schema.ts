import { z } from 'zod'

/**
 * Mirrors server/api/v1/employees/index.post.ts's createEmployeeSchema and
 * [id].put.ts's updateEmployeeSchema field-for-field so the wizard never sends
 * a shape the API doesn't accept. Keep these two in sync if the server schema changes.
 */
export const identitySchema = z.object({
  employeeCode: z.string().min(1, 'Kode karyawan wajib diisi').max(32),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').max(255),
  email: z.string().min(1, 'Email wajib diisi').email('Email tidak valid').max(255),
  phone: z.string().max(32).optional().or(z.literal('')),
  nik: z.string().max(25).optional().or(z.literal('')),
  instagram: z.string().max(100).optional().or(z.literal('')),
  tiktok: z.string().max(100).optional().or(z.literal('')),
  status: z.number().int().optional(),
})

// KTP / personal data + domicile — all optional, matching the "documents/extra data can be
// completed later" decision. Not part of the auto-create-on-Identity payload; saved via a
// PUT once this step is reached.
export const dataPribadiSchema = z.object({
  birthDate: z.string().optional().or(z.literal('')),
  religion: z.string().max(50).optional().or(z.literal('')),
  bloodType: z.string().max(3).optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional().or(z.literal('')),
  maritalStatus: z.string().max(30).optional().or(z.literal('')),
  ktpAddress: z.string().optional().or(z.literal('')),
  npwp: z.string().max(30).optional().or(z.literal('')),
  domicileAddress: z.string().optional().or(z.literal('')),
  domicileOwnership: z.string().max(30).optional().or(z.literal('')),
})

export const employmentSchema = z.object({
  companyId: z.string().uuid('Perusahaan wajib dipilih'),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  positionId: z.string().uuid().optional().or(z.literal('')),
  divisionId: z.string().uuid().optional().or(z.literal('')),
  teamId: z.string().uuid().optional().or(z.literal('')),
  joinDate: z.string().min(1, 'Tanggal join wajib diisi'),
  // Write-only — inserted as an employee_level_histories row (via level-histories.post.ts
  // once the employee exists), never a column on the employees table itself.
  initialLevelId: z.string().uuid('Level awal wajib dipilih').optional().or(z.literal('')),
  contractEndDate: z.string().optional().or(z.literal('')),
  dominance: z.string().max(10).optional().or(z.literal('')),
  bpjsType: z.string().max(30).optional().or(z.literal('')),
  taxStatus: z.string().max(10).optional().or(z.literal('')),
  gajiPokokEmp: z.string().optional().or(z.literal('')),
})

export const bankingSchema = z.object({
  bankId: z.string().uuid().optional().or(z.literal('')),
  accountNumber: z.string().max(50).optional().or(z.literal('')),
})

// --- All steps below are server-backed (server/api/v1/employees/[id]/{education,family,
// family-tree,emergency-contacts,work-experiences,organization,hobbies,languages}.*) — each
// row is saved immediately once employeeId exists, so there's no array-level "step schema" to
// validate here anymore. These item shapes are just the row TypeScript types; a row is allowed
// to be empty (created via "+ Tambah" with placeholder text, filled in progressively), matching
// the corresponding DB columns which are all nullable — so no field here is `.min(1)`-required. ---

export const educationItemSchema = z.object({
  degree: z.string().max(255).optional().or(z.literal('')),
  schoolName: z.string().max(255).optional().or(z.literal('')),
  schoolYear: z.string().max(255).optional().or(z.literal('')),
})

export const familyItemSchema = z.object({
  name: z.string().max(255).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  familyRelation: z.string().max(25).optional().or(z.literal('')),
})

export const emergencyContactItemSchema = z.object({
  name: z.string().max(255).optional().or(z.literal('')),
  relation: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(255).optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
})

export const workExperienceItemSchema = z.object({
  companyName: z.string().max(255).optional().or(z.literal('')),
  workPosition: z.string().max(255).optional().or(z.literal('')),
  workLength: z.string().max(255).optional().or(z.literal('')),
  salaryPerMonth: z.string().max(100).optional().or(z.literal('')),
  reasonForLeaving: z.string().max(255).optional().or(z.literal('')),
})

export const organizationItemSchema = z.object({
  name: z.string().max(50).optional().or(z.literal('')),
  position: z.string().max(50).optional().or(z.literal('')),
  organizationLength: z.string().max(50).optional().or(z.literal('')),
})

export const familyTreeItemSchema = z.object({
  name: z.string().max(50).optional().or(z.literal('')),
  relation: z.string().max(50).optional().or(z.literal('')),
  gender: z.enum(['L', 'P']).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  lastEducation: z.string().max(50).optional().or(z.literal('')),
  lastWork: z.string().max(50).optional().or(z.literal('')),
  lastInstitute: z.string().max(50).optional().or(z.literal('')),
})

export const languageItemSchema = z.object({
  language: z.string().min(1, 'Bahasa wajib diisi').max(50),
  proficiency: z.string().min(1, 'Level wajib dipilih').max(20),
})

export type IdentityForm = z.infer<typeof identitySchema>
export type DataPribadiForm = z.infer<typeof dataPribadiSchema>
export type EmploymentForm = z.infer<typeof employmentSchema>
export type BankingForm = z.infer<typeof bankingSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type FamilyItem = z.infer<typeof familyItemSchema>
export type EmergencyContactItem = z.infer<typeof emergencyContactItemSchema>
export type WorkExperienceItem = z.infer<typeof workExperienceItemSchema>
export type OrganizationItem = z.infer<typeof organizationItemSchema>
export type FamilyTreeItem = z.infer<typeof familyTreeItemSchema>
export type LanguageItem = z.infer<typeof languageItemSchema>

/** Builds the exact payload shape createEmployeeSchema/updateEmployeeSchema expect. Blank-optional fields are dropped, not sent as ''. */
export function buildEmployeePayload(formData: {
  identity?: Partial<IdentityForm>
  dataPribadi?: Partial<DataPribadiForm>
  employment?: Partial<EmploymentForm>
  banking?: Partial<BankingForm>
}) {
  const raw = {
    ...formData.identity,
    ...formData.dataPribadi,
    ...formData.employment,
    ...formData.banking,
  }
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined))
}
