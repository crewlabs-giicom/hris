<script setup lang="ts">
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const tabsStore = usePageTabsStore()

const pageTitle = computed(() => {
  const qType = route.query.type as string
  if (qType === 'freelance') return 'Add Freelance'
  if (qType === 'internship') return 'Add Internship'
  return 'Add Employee'
})

onMounted(() => {
  const activeTab = tabsStore.tabs.find((t) => t.path === route.path)
  if (activeTab) {
    activeTab.title = pageTitle.value
  }
})
</script>

<template>
  <div>
    <UiPageHeader :title="pageTitle" breadcrumb="Master / HR Data / Employee Database / Baru" />
    <div class="mt-3">
      <EmployeeWizardLayout mode="create" />
    </div>
  </div>
</template>
