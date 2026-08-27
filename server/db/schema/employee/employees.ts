import { mysqlTable, varchar, date, mysqlEnum, timestamp, text, index, int, decimal } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { departments, positions, divisions, teams, companies, banks } from '../master-data'
import { users } from '../auth'

export const employees = mysqlTable(
  'employees',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    userId: int('user_id').references(() => users.id),

    employeeCode: varchar('employee_code', { length: 32 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 32 }),
    nik: varchar('nik', { length: 25 }).unique(),

    departmentId: int('department_id').references(() => departments.id),
    positionId: int('position_id').references(() => positions.id),
    divisionId: int('division_id').references(() => divisions.id),
    companyId: int('company_id').references(() => companies.id),

    bankId: int('bank_id').references(() => banks.id),
    accountNumber: varchar('account_number', { length: 50 }),

    birthDate: date('birth_date', { mode: 'string' }),
    religion: varchar('religion', { length: 50 }),
    bloodType: varchar('blood_type', { length: 3 }),
    gender: mysqlEnum('gender', ['male', 'female']),
    maritalStatus: varchar('marital_status', { length: 30 }),
    ktpAddress: text('ktp_address'),
    npwp: varchar('npwp', { length: 30 }),

    domicileAddress: text('domicile_address'),
    domicileOwnership: varchar('domicile_ownership', { length: 30 }),

    instagram: varchar('instagram', { length: 100 }),
    tiktok: varchar('tiktok', { length: 100 }),
    contractEndDate: date('contract_end_date', { mode: 'string' }),
    dominance: varchar('dominance', { length: 10 }),
    bpjsType: varchar('bpjs_type', { length: 30 }),
    taxStatus: varchar('tax_status', { length: 10 }),

    photoPath: varchar('photo_path', { length: 255 }),
    status: int('status').notNull().default(1),
    gajiPokokEmp: decimal('gaji_pokok_emp', { precision: 20, scale: 0 }),
    basicSalary: decimal('basic_salary', { precision: 20, scale: 0 }),
    allowance: decimal('allowance', { precision: 20, scale: 0 }),

    employmentStatus: mysqlEnum('employment_status', [
      'pending_activation',
      'active',
      'resigned',
      'terminated',
    ])
      .notNull()
      .default('pending_activation'),

    joinDate: date('join_date', { mode: 'string' }),
    resignDate: date('resign_date', { mode: 'string' }),

    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    departmentIdx: index('employees_department_idx').on(table.departmentId),
    statusIdx: index('employees_status_idx').on(table.employmentStatus),
  })
)
