# HRIS — Starter Skeleton

Fondasi Nuxt 3 + Nitro + Drizzle (MySQL) sesuai arsitektur yang sudah disepakati
(lihat `HRIS_Arsitektur.docx`). Skeleton ini sudah siap jalan: koneksi DB, JWT
auth (login/refresh/verify/activate/logout), audit log & API key table, dan
satu contoh endpoint employees yang mengikuti pola auth guard + role guard.

## Menjalankan

```bash
npm install
cp .env.example .env   # isi kredensial MySQL lokal kamu

npm run db:generate    # generate migration dari schema
npm run db:migrate     # jalankan migration ke database
npm run db:seed        # isi data contoh (admin@gii.local / password123)

npm run dev            # jalan di http://localhost:3000
```

`npm run db:studio` membuka GUI Drizzle Studio untuk lihat/edit data tanpa nulis query.

## Struktur

```
/app
  /pages/login.vue, index.vue     <- contoh halaman minimal
  /stores/auth.ts                 <- Pinia store: login, logout, refresh
  /middleware/auth.ts              <- route guard client-side

/server
  /api/v1/auth/
    login.post.ts       <- email+password -> access + refresh token
    refresh.post.ts      <- tukar refresh token -> access token baru
    verify.post.ts        <- dipanggil consumer app (Backbone/Ticketing) via x-api-key
    activate.post.ts      <- karyawan set password sendiri lewat invite link (saat TTD kontrak)
    logout.post.ts        <- revoke satu refresh token
  /api/v1/employees/
    index.get.ts          <- contoh endpoint internal (auth guard + role guard)
    [id].get.ts             <- contoh endpoint server-to-server (api key, dipakai Backbone/Ticketing)

  /db/
    schema/                <- employees, departments, positions, auth (users, refresh_tokens,
                                activation_tokens, api_clients, audit_logs)
    index.ts                <- koneksi pool + drizzle instance (useDb())
    seed.ts                 <- data contoh untuk dev

  /utils/
    jwt.ts                  <- sign/verify access & refresh token
    password.ts             <- hash password + hash token (refresh/activation)
    apiKey.ts               <- requireApiClient() untuk endpoint server-to-server
    requireAuth.ts          <- requireAuth() + requireRole() untuk endpoint internal
```

## Yang sudah diimplementasikan sesuai keputusan arsitektur

- **HRIS sebagai IdP**: `/api/v1/auth/verify` dipanggil consumer (Backbone, Ticketing)
  dengan header `x-api-key`, terpisah dari JWT user.
- **Self-service account creation**: `/api/v1/auth/activate` — karyawan set
  password sendiri via token undangan, bukan kredensial dibuat admin.
- **Refresh token revocation**: setiap refresh token disimpan (hash) di tabel
  `refresh_tokens` sehingga bisa direvoke satu-satu atau semua sekaligus saat resign.
- **Audit log**: tabel `audit_logs` sudah ada di schema (endpoint belum menulis
  ke sana secara otomatis — ditandai `// TODO` di `login.post.ts` dan `activate.post.ts`).
- **Role-based access**: enum role (`employee`, `approver`, `hr_admin`, `super_admin`)
  + helper `requireRole()`.
- **Service-to-service auth**: tabel `api_clients` + `requireApiClient()`, dipakai
  di endpoint yang boleh diakses Backbone/Ticketing tanpa user login.

## Yang masih perlu ditambahkan tim (belum di-scaffold)

- Endpoint untuk generate & mengirim activation link (trigger saat status
  employee pindah ke `pending_activation`, biasanya saat kontrak dibuat).
- Modul attendance & leave (schema + endpoint) — folder `/server/api/v1/`
  sudah siap ditambah `attendance/` dan `leave/` mengikuti pola yang sama
  seperti `employees/`.
- Penulisan aktual ke `audit_logs` di setiap endpoint yang mengubah data.
- Endpoint SSO callback di sisi Backbone (di luar repo ini — dikerjakan di
  codebase Laravel, cukup verify token ke `/api/v1/auth/verify`).
- Rate limiting per consumer & endpoint health check (`/api/health`).
- OpenAPI/Swagger documentation.
- Migrasi data dari HRIS lama (akan diatur langsung, di luar scope skeleton ini).
