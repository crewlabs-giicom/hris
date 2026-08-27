// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },

  srcDir: 'app',
  serverDir: 'server',

  app: {
    keepalive: true,
  },

  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only (never exposed to client)
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'hris',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '30d',

    // Comma-separated list of API keys allowed to call server-to-server endpoints
    consumerApiKeys: process.env.CONSUMER_API_KEYS || '',

    // Exposed to client
    public: {
      appName: 'HRIS',
    },
  },

  typescript: {
    strict: true,
  },
})