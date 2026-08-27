<script setup lang="ts">
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const employeeId = route.params.id as string
const tabsStore = usePageTabsStore()

onMounted(() => {
  const activeTab = tabsStore.tabs.find((t) => t.path === route.path)
  if (activeTab) {
    activeTab.title = 'Edit Employee'
  }
})
</script>

<template>
  <div>
    <UiPageHeader title="Edit Employee" breadcrumb="Master / HR Data / Employee Database / Edit" />
    <div class="mt-3">
      <EmployeeWizardLayout mode="edit" :employee-id="employeeId" />
    </div>
  </div>
</template>
