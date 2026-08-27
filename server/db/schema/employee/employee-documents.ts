import { mysqlTable, varchar, mysqlEnum, int, timestamp, uniqueIndex, index } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeDocuments = mysqlTable(
  'employee_documents',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    documentType: mysqlEnum('document_type', ['ktp', 'bpjs', 'npwp', 'bank_account']).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: int('file_size').notNull(),
    uploadedAt: timestamp('uploaded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    employeeIdx: index('employee_documents_employee_idx').on(table.employeeId),
    employeeTypeUnique: uniqueIndex('employee_documents_employee_type_unique').on(table.employeeId, table.documentType),
  })
)
