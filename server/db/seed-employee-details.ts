import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { eq } from 'drizzle-orm'
import { faker } from '@faker-js/faker'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })
  const db = drizzle(pool, { schema, mode: 'default' })

  console.log('Fetching all current employees...')
  const allEmployees = await db.select().from(schema.employees)
  console.log(`Found ${allEmployees.length} employees.`)

  // Status mapping
  const statuses = [1, 2, 3, 4]

  console.log('Seeding rich employee profile details...')
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i]
    const statusVal = statuses[i % statuses.length]
    
    // Generate gender and marital info
    const isMale = faker.datatype.boolean()
    const gender = isMale ? 'male' as const : 'female' as const
    const maritalStatus = faker.helpers.arrayElement(['Single', 'Married', 'Divorced'])
    
    // Update main employee fields
    const birthDate = faker.date.birthdate({ min: 20, max: 45, mode: 'age' }).toISOString().slice(0, 10)
    const phone = faker.phone.number({ style: 'international' })
    const ktpAddress = faker.location.streetAddress(true)
    
    await db
      .update(schema.employees)
      .set({
        status: statusVal,
        photoPath: `/uploads/profile/emp-${(i % 5) + 1}.png`, // distribute 5 profile photos
        phone,
        birthDate,
        religion: faker.helpers.arrayElement(['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']),
        bloodType: faker.helpers.arrayElement(['A', 'B', 'AB', 'O']),
        gender,
        maritalStatus,
        ktpAddress,
        npwp: faker.string.numeric(15),
        domicileAddress: faker.datatype.boolean() ? ktpAddress : faker.location.streetAddress(true),
        domicileOwnership: faker.helpers.arrayElement(['Milik Pribadi', 'Milik Orang Tua', 'Sewa', 'Kontrak']),
        nik: faker.string.numeric(16),
        instagram: faker.internet.userName({ firstName: emp.fullName.split(' ')[0] }).toLowerCase(),
        tiktok: faker.internet.userName({ firstName: emp.fullName.split(' ')[0] }).toLowerCase(),
        bpjsType: faker.helpers.arrayElement(['TK dan KS', 'Hanya Ketenagakerjaan', 'Hanya Kesehatan', 'Tidak Ada']),
        taxStatus: faker.helpers.arrayElement(['TK/0', 'TK/1', 'TK/2', 'K/0', 'K/1', 'K/2']),
        gajiPokokEmp: faker.number.int({ min: 5000000, max: 15000000 }).toString(),
        accountNumber: faker.string.numeric(10),
      })
      .where(eq(schema.employees.id, emp.id))

    // 1. Clean up existing details
    await db.delete(schema.employeeEducation).where(eq(schema.employeeEducation.employeeId, emp.id))
    await db.delete(schema.employeeEmergencyContacts).where(eq(schema.employeeEmergencyContacts.employeeId, emp.id))
    await db.delete(schema.employeeFamily).where(eq(schema.employeeFamily.employeeId, emp.id))
    await db.delete(schema.employeeFamilyTree).where(eq(schema.employeeFamilyTree.employeeId, emp.id))
    await db.delete(schema.employeeLanguages).where(eq(schema.employeeLanguages.employeeId, emp.id))
    await db.delete(schema.employeeHobbies).where(eq(schema.employeeHobbies.employeeId, emp.id))
    await db.delete(schema.employeeWorkExperiences).where(eq(schema.employeeWorkExperiences.employeeId, emp.id))

    // 1.5 Seed Work Experiences
    await db.insert(schema.employeeWorkExperiences).values([
      {
        employeeId: emp.id,
        companyName: faker.company.name(),
        workPosition: faker.person.jobTitle(),
        workLength: faker.number.int({ min: 1, max: 3 }) + ' Tahun',
        salaryPerMonth: faker.number.int({ min: 4000000, max: 9000000 }).toString(),
        reasonForLeaving: faker.helpers.arrayElement([
          'Ingin mencari tantangan baru',
          'Kontrak kerja berakhir',
          'Relokasi domisili',
          'Mencari peluang pengembangan karir'
        ])
      }
    ])

    // 2. Seed Education (2 rows per employee)
    await db.insert(schema.employeeEducation).values([
      {
        employeeId: emp.id,
        degree: 'SMA IPA',
        schoolName: 'SMA Negeri ' + faker.number.int({ min: 1, max: 10 }),
        schoolYear: '2012 - 2015',
      },
      {
        employeeId: emp.id,
        degree: faker.helpers.arrayElement(['S1 Teknik Informatika', 'S1 Sistem Informasi', 'S1 Manajemen', 'S1 Akuntansi']),
        schoolName: faker.helpers.arrayElement(['Universitas Indonesia', 'Institut Teknologi Bandung', 'Universitas Gadjah Mada', 'Binus University']),
        schoolYear: '2015 - 2019',
      }
    ])

    // 3. Seed Emergency Contact
    await db.insert(schema.employeeEmergencyContacts).values({
      employeeId: emp.id,
      name: faker.person.fullName({ sex: 'female' }),
      relation: faker.helpers.arrayElement(['Orang Tua', 'Saudara Kandung', 'Pasangan', 'Teman Dekat']),
      phone: faker.phone.number({ style: 'international' }),
      address: faker.location.streetAddress(),
    })

    // 4. Seed Family Members (if married)
    if (maritalStatus === 'Married') {
      const spouseSex = gender === 'male' ? 'female' : 'male'
      await db.insert(schema.employeeFamily).values([
        {
          employeeId: emp.id,
          name: faker.person.fullName({ sex: spouseSex }),
          birthDate: faker.date.birthdate({ min: 20, max: 40, mode: 'age' }).toISOString().slice(0, 10),
          familyRelation: gender === 'male' ? 'istri' : 'suami',
        },
        {
          employeeId: emp.id,
          name: faker.person.fullName(),
          birthDate: faker.date.birthdate({ min: 1, max: 10, mode: 'age' }).toISOString().slice(0, 10),
          familyRelation: 'anak',
        }
      ])
    }

    // 5. Seed Family Tree (Parents/Siblings)
    await db.insert(schema.employeeFamilyTree).values([
      {
        employeeId: emp.id,
        name: faker.person.fullName({ sex: 'male' }),
        relation: 'ayah',
        gender: 'L',
        birthDate: faker.date.birthdate({ min: 50, max: 70, mode: 'age' }).toISOString().slice(0, 10),
        lastEducation: 'S1',
        lastWork: 'Pensiunan',
        lastInstitute: '-',
      },
      {
        employeeId: emp.id,
        name: faker.person.fullName({ sex: 'female' }),
        relation: 'ibu',
        gender: 'P',
        birthDate: faker.date.birthdate({ min: 45, max: 65, mode: 'age' }).toISOString().slice(0, 10),
        lastEducation: 'SMA',
        lastWork: 'Ibu Rumah Tangga',
        lastInstitute: '-',
      }
    ])

    // 6. Seed Languages (1-2 languages)
    const languagesToInsert = [
      { employeeId: emp.id, language: 'Bahasa Indonesia', proficiency: 'Native' }
    ]
    if (faker.datatype.boolean()) {
      languagesToInsert.push({
        employeeId: emp.id,
        language: 'Bahasa Inggris',
        proficiency: faker.helpers.arrayElement(['Cukup', 'Bagus', 'Lancar'])
      })
    }
    await db.insert(schema.employeeLanguages).values(languagesToInsert)

    // 7. Seed Hobbies
    await db.insert(schema.employeeHobbies).values({
      employeeId: emp.id,
      hobby: faker.helpers.arrayElement(['Membaca, Traveling', 'Fotografi, Musik', 'Olahraga, Gaming', 'Memasak, Kebun']),
    })

    console.log(`Successfully seeded details for ${emp.fullName}`)
  }

  console.log('All employee details seeded successfully.')
  await pool.end()
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})
