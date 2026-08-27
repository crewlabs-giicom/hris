<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('admin@gii.local')
const password = ref('')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center font-sans p-6 bg-gradient-to-br from-topbar-1 to-topbar-2">
    <div
      class="w-full max-w-[900px] flex rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,.35)]"
    >
      <!-- LEFT — brand panel -->
      <aside
        class="hidden md:flex w-[44%] min-w-[340px] relative flex-col justify-between p-9 overflow-hidden bg-gradient-to-br from-topbar-1 to-topbar-2"
      >
        <div class="absolute w-[300px] h-[300px] rounded-full -top-24 -right-20 bg-white/15" />
        <div class="absolute w-[220px] h-[220px] rounded-full -bottom-16 -left-16 bg-black/15" />
        <div class="absolute w-[130px] h-[130px] rounded-full bottom-20 left-[38%] bg-white/20" />
        <div class="absolute w-[70px] h-[70px] rounded-full top-[42%] right-10 bg-black/10" />

        <div class="flex items-center gap-2.5 relative z-10">
          <div
            class="w-[34px] h-[34px] rounded-lg bg-white/20 flex items-center justify-center text-white font-extrabold text-base"
          >
            B
          </div>
          <div>
            <div class="text-white font-bold text-[15px] tracking-wide">Baseque</div>
            <div class="text-white/70 text-[11px] mt-px">HRIS · GII COMMERCE</div>
          </div>
        </div>

        <div class="relative z-10 max-w-[380px]">
          <h1 class="text-white text-[26px] font-extrabold leading-[1.3] tracking-tight">
            Satu sistem, semua kebutuhan HR &amp; operasional GII.
          </h1>
          <p class="text-white/80 text-[13px] mt-2.5 leading-relaxed">
            Kelola data karyawan, approval, kontrak, hingga aset perusahaan dalam satu platform yang cepat dan rapi.
          </p>
          <div class="flex gap-6 mt-7">
            <div>
              <b class="text-white text-xl font-extrabold block">1.200+</b>
              <span class="text-white/70 text-[11px]">Karyawan aktif</span>
            </div>
            <div>
              <b class="text-white text-xl font-extrabold block">18</b>
              <span class="text-white/70 text-[11px]">Team &amp; divisi</span>
            </div>
            <div>
              <b class="text-white text-xl font-extrabold block">99.9%</b>
              <span class="text-white/70 text-[11px]">Uptime sistem</span>
            </div>
          </div>
        </div>

        <div class="relative z-10 text-white/60 text-[11px]">© 2026 GII Commerce · Internal System</div>
      </aside>

      <!-- RIGHT — form panel -->
      <main class="flex-1 flex items-center justify-center bg-white p-6">
        <div class="w-full max-w-[360px] px-[30px] pt-8 pb-7">
        <div class="mb-[22px]">
          <h2 class="text-[19px] font-extrabold text-ink">Masuk ke akun kamu</h2>
          <p class="text-xs text-ink-soft mt-1">Gunakan email &amp; password perusahaan kamu.</p>
        </div>

        <form class="flex flex-col" @submit.prevent="onSubmit">
          <div class="mb-3.5">
            <label class="block text-[11.5px] font-semibold text-ink mb-1.5">Email</label>
            <div class="relative">
              <svg
                class="absolute left-[11px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-ink-soft"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 6l-10 7L2 6" />
                <path d="M2 6h20v12H2z" />
              </svg>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="username"
                placeholder="nama@giicommerce.com"
                class="w-full text-[13px] pl-[34px] pr-3 py-2.5 border border-line rounded-lg bg-[#FBFBFC] outline-none text-ink transition-colors focus:border-topbar-1 focus:bg-white focus:shadow-[0_0_0_3px_rgba(240,80,30,.12)]"
              />
            </div>
          </div>

          <div class="mb-1.5">
            <label class="block text-[11.5px] font-semibold text-ink mb-1.5">Password</label>
            <div class="relative">
              <svg
                class="absolute left-[11px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-ink-soft"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              <input
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full text-[13px] pl-[34px] pr-3 py-2.5 border border-line rounded-lg bg-[#FBFBFC] outline-none text-ink transition-colors focus:border-topbar-1 focus:bg-white focus:shadow-[0_0_0_3px_rgba(240,80,30,.12)]"
              />
            </div>
          </div>

          <div class="flex justify-end -mt-1.5 mb-3.5">
            <a href="#" class="text-[11.5px] text-topbar-1 font-semibold">Lupa password?</a>
          </div>

          <p v-if="error" class="text-red-600 text-xs mb-3">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-[11px] border-none rounded-lg bg-gradient-to-r from-topbar-1 to-topbar-2 text-white text-[13.5px] font-bold cursor-pointer shadow-[0_8px_20px_-8px_rgba(233,38,76,.55)] transition-transform hover:-translate-y-px disabled:opacity-70"
          >
            {{ loading ? 'Memproses...' : 'Login' }}
          </button>
        </form>

        <div class="flex items-center gap-2.5 my-[18px] text-ink-soft text-[11px] before:content-[''] before:flex-1 before:h-px before:bg-line after:content-[''] after:flex-1 after:h-px after:bg-line">
          atau
        </div>

        <p class="text-center text-xs text-ink-soft">
          Belum punya akun? <a href="#" class="text-topbar-1 font-semibold">Hubungi admin HR</a>
        </p>
        </div>
      </main>
    </div>
  </div>
</template>
