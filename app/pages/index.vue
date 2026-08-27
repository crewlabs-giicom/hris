<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <div>
    <UiPageHeader title="Dashboard" breadcrumb="Dashboard" />
    <UiCard class="mt-3 p-4">
      <p v-if="auth.user" class="text-sm text-ink">
        Logged in as {{ auth.user.email }} ({{ auth.user.role }})
      </p>
      <p v-else class="text-sm text-ink">
        <NuxtLink to="/login" class="text-topbar-1 font-medium">Login</NuxtLink>
      </p>
    </UiCard>
  </div>
</template>
