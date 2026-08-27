<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage v-slot="{ Component, route }">
      <KeepAlive :max="20">
        <component :is="Component" :key="route.path" />
      </KeepAlive>
    </NuxtPage>
  </NuxtLayout>
  <Toaster position="top-right" rich-colors close-button />
</template>
