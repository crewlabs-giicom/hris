import { relations } from 'drizzle-orm'
import { departments, positions, divisions, levels, companies, banks, teams, permissionsType, teamHasUsers, shifts, rooms, roomReservations, manufacturers, assets, assetImages, assetHasEmployees, assetRequests, assetRequestDetails, assetRequestImages, assetRequestDetailImages, assetDepreciationRuns, assetDepreciationLogs } from './master-data'
import {
  employees,
  employeeLevelHistories,
  employeeEducation,
  employeeEmergencyContacts,
  employeeFamily,
  employeeFamilyTree,
  employeeOrganization,
  employeeWorkExperiences,
  employeeHobbies,
  employeeLanguages,
  employeeDocuments,
  employeePermissions,
  permissionAttachments,
  employeePaidLeaves,
  resignations,
  resignationAssets,
  resignationTasks,
  schedules,
  scheduleAdjustments,
  manualAttendances,
  manualAttendanceAttachments,
  employeeAttendances,
  employeeAttendanceDetails,
  insentives,
  deductions,
  attendanceConsolidations,
  attendanceConsolidationDays,
} from './employee'
import { users } from './auth'

/**
 * Single source of truth for every table's relations (both "belongsTo" and
 * "hasMany" sides) — the closest equivalent here to an Eloquent model's
 * relationship methods. Kept in one file (instead of split across schema
 * files) because master-data <-> employee relations would otherwise require
 * a circular import between the two schema groups.
 */

// ---- master-data ----

export const departmentsRelations = relations(departments, ({ many }) => ({
  positions: many(positions),
  employees: many(employees),
}))

export const positionsRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, { fields: [positions.departmentId], references: [departments.id] }),
  employees: many(employees),
}))

export const divisionsRelations = relations(divisions, ({ many }) => ({
  employees: many(employees),
}))

export const levelsRelations = relations(levels, ({ many }) => ({
  levelHistories: many(employeeLevelHistories),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  employees: many(employees),
}))

export const banksRelations = relations(banks, ({ many }) => ({
  employees: many(employees),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(employees, { fields: [teams.leaderId], references: [employees.id] }),
  pic: one(employees, { fields: [teams.picId], references: [employees.id] }),
  teamHasUsers: many(teamHasUsers),
}))

export const roomsRelations = relations(rooms, ({ many }) => ({
  reservations: many(roomReservations),
}))

export const roomReservationsRelations = relations(roomReservations, ({ one }) => ({
  employee: one(employees, { fields: [roomReservations.employeeId], references: [employees.id], relationName: 'roomReservations_employeeId' }),
  room: one(rooms, { fields: [roomReservations.roomId], references: [rooms.id] }),
  creator: one(employees, { fields: [roomReservations.createdBy], references: [employees.id], relationName: 'roomReservations_createdBy' }),
  updater: one(employees, { fields: [roomReservations.updatedBy], references: [employees.id], relationName: 'roomReservations_updatedBy' }),
  deleter: one(employees, { fields: [roomReservations.deletedBy], references: [employees.id], relationName: 'roomReservations_deletedBy' }),
}))

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  assets: many(assets),
}))

export const assetsRelations = relations(assets, ({ one, many }) => ({
  pt: one(companies, { fields: [assets.ptId], references: [companies.id] }),
  manufacture: one(manufacturers, { fields: [assets.manufactureId], references: [manufacturers.id] }),
  room: one(rooms, { fields: [assets.roomId], references: [rooms.id] }),
  division: one(divisions, { fields: [assets.divisi], references: [divisions.id] }),
  images: many(assetImages),
  assetHasEmployees: many(assetHasEmployees),
  depreciationLogs: many(assetDepreciationLogs),
  creator: one(users, { fields: [assets.createdBy], references: [users.id] }),
  updater: one(users, { fields: [assets.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [assets.deletedBy], references: [users.id] }),
}))

export const assetDepreciationRunsRelations = relations(assetDepreciationRuns, ({ one, many }) => ({
  creator: one(users, { fields: [assetDepreciationRuns.createdBy], references: [users.id] }),
  logs: many(assetDepreciationLogs),
}))

export const assetDepreciationLogsRelations = relations(assetDepreciationLogs, ({ one }) => ({
  run: one(assetDepreciationRuns, { fields: [assetDepreciationLogs.runId], references: [assetDepreciationRuns.id] }),
  asset: one(assets, { fields: [assetDepreciationLogs.assetId], references: [assets.id] }),
}))

export const assetImagesRelations = relations(assetImages, ({ one }) => ({
  asset: one(assets, { fields: [assetImages.assetId], references: [assets.id] }),
}))

export const assetHasEmployeesRelations = relations(assetHasEmployees, ({ one }) => ({
  asset: one(assets, { fields: [assetHasEmployees.assetId], references: [assets.id] }),
  employee: one(employees, { fields: [assetHasEmployees.employeeId], references: [employees.id] }),
}))

export const assetRequestsRelations = relations(assetRequests, ({ one, many }) => ({
  employee: one(employees, { fields: [assetRequests.employeeId], references: [employees.id], relationName: 'assetRequests_employeeId' }),
  pt: one(companies, { fields: [assetRequests.ptId], references: [companies.id] }),
  finance: one(employees, { fields: [assetRequests.financeId], references: [employees.id], relationName: 'assetRequests_financeId' }),
  details: many(assetRequestDetails),
  images: many(assetRequestImages),
  creator: one(users, { fields: [assetRequests.createdBy], references: [users.id] }),
  updater: one(users, { fields: [assetRequests.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [assetRequests.deletedBy], references: [users.id] }),
}))

export const assetRequestDetailsRelations = relations(assetRequestDetails, ({ one, many }) => ({
  assetRequest: one(assetRequests, { fields: [assetRequestDetails.assetRequestId], references: [assetRequests.id] }),
  manufacture: one(manufacturers, { fields: [assetRequestDetails.manufacturerId], references: [manufacturers.id] }),
  room: one(rooms, { fields: [assetRequestDetails.roomId], references: [rooms.id] }),
  detailImages: many(assetRequestDetailImages),
}))

export const assetRequestImagesRelations = relations(assetRequestImages, ({ one }) => ({
  assetRequest: one(assetRequests, { fields: [assetRequestImages.assetRequestId], references: [assetRequests.id] }),
}))

export const assetRequestDetailImagesRelations = relations(assetRequestDetailImages, ({ one }) => ({
  detail: one(assetRequestDetails, { fields: [assetRequestDetailImages.assetRequestDetailId], references: [assetRequestDetails.id] }),
}))

// ---- employee ----

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  position: one(positions, { fields: [employees.positionId], references: [positions.id] }),
  division: one(divisions, { fields: [employees.divisionId], references: [divisions.id] }),
  company: one(companies, { fields: [employees.companyId], references: [companies.id] }),
  bank: one(banks, { fields: [employees.bankId], references: [banks.id] }),

  levelHistories: many(employeeLevelHistories),
  education: many(employeeEducation),
  emergencyContacts: many(employeeEmergencyContacts),
  family: many(employeeFamily),
  familyTree: many(employeeFamilyTree),
  organization: many(employeeOrganization),
  workExperiences: many(employeeWorkExperiences),
  hobbies: many(employeeHobbies),
  languages: many(employeeLanguages),
  documents: many(employeeDocuments),
  employeePermissions: many(employeePermissions),
  paidLeaves: many(employeePaidLeaves, { relationName: 'employeePaidLeaves_employeeId' }),
  responsiblePaidLeaves: many(employeePaidLeaves, { relationName: 'employeePaidLeaves_personResponsibleId' }),
  resignations: many(resignations),
  schedules: many(schedules),
  scheduleAdjustments: many(scheduleAdjustments),
  manualAttendances: many(manualAttendances),
  employeeAttendances: many(employeeAttendances),
  insentives: many(insentives),
  deductions: many(deductions),
  attendanceConsolidations: many(attendanceConsolidations),
  roomReservations: many(roomReservations, { relationName: 'roomReservations_employeeId' }),
  createdRoomReservations: many(roomReservations, { relationName: 'roomReservations_createdBy' }),
  deletedRoomReservations: many(roomReservations, { relationName: 'roomReservations_deletedBy' }),
  assetHasEmployees: many(assetHasEmployees),
  assetRequests: many(assetRequests, { relationName: 'assetRequests_employeeId' }),
  assignedFinanceAssetRequests: many(assetRequests, { relationName: 'assetRequests_financeId' }),
}))

export const employeeLevelHistoriesRelations = relations(employeeLevelHistories, ({ one }) => ({
  employee: one(employees, { fields: [employeeLevelHistories.employeeId], references: [employees.id] }),
  level: one(levels, { fields: [employeeLevelHistories.levelId], references: [levels.id] }),
}))

export const employeeEducationRelations = relations(employeeEducation, ({ one }) => ({
  employee: one(employees, { fields: [employeeEducation.employeeId], references: [employees.id] }),
}))

export const employeeEmergencyContactsRelations = relations(employeeEmergencyContacts, ({ one }) => ({
  employee: one(employees, { fields: [employeeEmergencyContacts.employeeId], references: [employees.id] }),
}))

export const employeeFamilyRelations = relations(employeeFamily, ({ one }) => ({
  employee: one(employees, { fields: [employeeFamily.employeeId], references: [employees.id] }),
}))

export const employeeFamilyTreeRelations = relations(employeeFamilyTree, ({ one }) => ({
  employee: one(employees, { fields: [employeeFamilyTree.employeeId], references: [employees.id] }),
}))

export const employeeOrganizationRelations = relations(employeeOrganization, ({ one }) => ({
  employee: one(employees, { fields: [employeeOrganization.employeeId], references: [employees.id] }),
}))

export const employeeWorkExperiencesRelations = relations(employeeWorkExperiences, ({ one }) => ({
  employee: one(employees, { fields: [employeeWorkExperiences.employeeId], references: [employees.id] }),
}))

export const employeeHobbiesRelations = relations(employeeHobbies, ({ one }) => ({
  employee: one(employees, { fields: [employeeHobbies.employeeId], references: [employees.id] }),
}))

export const employeeLanguagesRelations = relations(employeeLanguages, ({ one }) => ({
  employee: one(employees, { fields: [employeeLanguages.employeeId], references: [employees.id] }),
}))

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, { fields: [employeeDocuments.employeeId], references: [employees.id] }),
}))

export const employeePermissionsRelations = relations(employeePermissions, ({ one, many }) => ({
  employee: one(employees, { fields: [employeePermissions.employeeId], references: [employees.id] }),
  permissionType: one(permissionsType, { fields: [employeePermissions.permissionsTypeId], references: [permissionsType.id] }),
  creator: one(users, { fields: [employeePermissions.createdBy], references: [users.id] }),
  updater: one(users, { fields: [employeePermissions.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [employeePermissions.deletedBy], references: [users.id] }),
  attachments: many(permissionAttachments),
}))

export const permissionAttachmentsRelations = relations(permissionAttachments, ({ one }) => ({
  permission: one(employeePermissions, { fields: [permissionAttachments.permissionId], references: [employeePermissions.id] }),
}))

export const permissionsTypeRelations = relations(permissionsType, ({ many }) => ({
  employeePermissions: many(employeePermissions),
}))

export const employeePaidLeavesRelations = relations(employeePaidLeaves, ({ one }) => ({
  employee: one(employees, { fields: [employeePaidLeaves.employeeId], references: [employees.id], relationName: 'employeePaidLeaves_employeeId' }),
  personResponsible: one(employees, { fields: [employeePaidLeaves.personResponsibleId], references: [employees.id], relationName: 'employeePaidLeaves_personResponsibleId' }),
  creator: one(users, { fields: [employeePaidLeaves.createdBy], references: [users.id] }),
  updater: one(users, { fields: [employeePaidLeaves.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [employeePaidLeaves.deletedBy], references: [users.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  teamHasUsers: many(teamHasUsers),
}))

export const teamHasUsersRelations = relations(teamHasUsers, ({ one }) => ({
  team: one(teams, { fields: [teamHasUsers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamHasUsers.userId], references: [users.id] }),
}))

export const resignationsRelations = relations(resignations, ({ one, many }) => ({
  employee: one(employees, { fields: [resignations.employeeId], references: [employees.id] }),
  assets: many(resignationAssets),
  tasks: many(resignationTasks),
  creator: one(users, { fields: [resignations.createdBy], references: [users.id] }),
  updater: one(users, { fields: [resignations.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [resignations.deletedBy], references: [users.id] }),
}))

export const resignationAssetsRelations = relations(resignationAssets, ({ one }) => ({
  resignation: one(resignations, { fields: [resignationAssets.resignationId], references: [resignations.id] }),
}))

export const resignationTasksRelations = relations(resignationTasks, ({ one }) => ({
  resignation: one(resignations, { fields: [resignationTasks.resignationId], references: [resignations.id] }),
}))

export const shiftsRelations = relations(shifts, ({ many }) => ({
  schedules: many(schedules),
  adjustments: many(scheduleAdjustments),
}))

export const schedulesRelations = relations(schedules, ({ one }) => ({
  employee: one(employees, { fields: [schedules.employeeId], references: [employees.id] }),
  shift: one(shifts, { fields: [schedules.shiftId], references: [shifts.id] }),
  creator: one(users, { fields: [schedules.createdBy], references: [users.id] }),
  updater: one(users, { fields: [schedules.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [schedules.deletedBy], references: [users.id] }),
}))

export const scheduleAdjustmentsRelations = relations(scheduleAdjustments, ({ one }) => ({
  employee: one(employees, { fields: [scheduleAdjustments.employeeId], references: [employees.id] }),
  shift: one(shifts, { fields: [scheduleAdjustments.shiftId], references: [shifts.id] }),
  creator: one(users, { fields: [scheduleAdjustments.createdBy], references: [users.id] }),
  updater: one(users, { fields: [scheduleAdjustments.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [scheduleAdjustments.deletedBy], references: [users.id] }),
}))

export const manualAttendancesRelations = relations(manualAttendances, ({ one, many }) => ({
  employee: one(employees, { fields: [manualAttendances.employeeId], references: [employees.id] }),
  attachments: many(manualAttendanceAttachments),
  creator: one(users, { fields: [manualAttendances.createdBy], references: [users.id] }),
  updater: one(users, { fields: [manualAttendances.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [manualAttendances.deletedBy], references: [users.id] }),
}))

export const manualAttendanceAttachmentsRelations = relations(manualAttendanceAttachments, ({ one }) => ({
  manualAttendance: one(manualAttendances, { fields: [manualAttendanceAttachments.manualAttendanceId], references: [manualAttendances.id] }),
}))

export const employeeAttendancesRelations = relations(employeeAttendances, ({ one, many }) => ({
  employee: one(employees, { fields: [employeeAttendances.employeeId], references: [employees.id] }),
  details: many(employeeAttendanceDetails),
}))

export const employeeAttendanceDetailsRelations = relations(employeeAttendanceDetails, ({ one }) => ({
  attendance: one(employeeAttendances, { fields: [employeeAttendanceDetails.attendanceId], references: [employeeAttendances.id] }),
  permissionType: one(permissionsType, { fields: [employeeAttendanceDetails.permissionTypeId], references: [permissionsType.id] }),
}))

export const insentivesRelations = relations(insentives, ({ one }) => ({
  employee: one(employees, { fields: [insentives.employeeId], references: [employees.id] }),
  creator: one(users, { fields: [insentives.createdBy], references: [users.id] }),
  updater: one(users, { fields: [insentives.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [insentives.deletedBy], references: [users.id] }),
}))

export const deductionsRelations = relations(deductions, ({ one }) => ({
  employee: one(employees, { fields: [deductions.employeeId], references: [employees.id] }),
  creator: one(users, { fields: [deductions.createdBy], references: [users.id] }),
  updater: one(users, { fields: [deductions.updatedBy], references: [users.id] }),
  deleter: one(users, { fields: [deductions.deletedBy], references: [users.id] }),
}))

export const attendanceConsolidationsRelations = relations(attendanceConsolidations, ({ one, many }) => ({
  employee: one(employees, { fields: [attendanceConsolidations.employeeId], references: [employees.id] }),
  days: many(attendanceConsolidationDays),
}))

export const attendanceConsolidationDaysRelations = relations(attendanceConsolidationDays, ({ one }) => ({
  consolidation: one(attendanceConsolidations, { fields: [attendanceConsolidationDays.consolidationId], references: [attendanceConsolidations.id] }),
}))


