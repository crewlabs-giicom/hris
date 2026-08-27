<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Role {
  id: string
  name: string
  guardName: string
  permissionCount: number
}

interface Permission {
  id: string
  name: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'permissionCount', label: 'Permission Count', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Role>(
  (params) => useApi('/api/v1/admin/roles', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const allPermissions = ref<Permission[]>([])

const showFormModal = ref(false)
const editing = ref<Role | null>(null)
const formName = ref('')
const formPermissionIds = ref<Set<string>>(new Set())
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

const ACTION_COLUMNS = ['view', 'create', 'update', 'delete', 'manage']

// permissions grouped by resource prefix (e.g. "users.create" -> group "users", action "create")
const permissionGroups = computed(() => {
  const groups: Record<string, { action: string; permission: Permission }[]> = {}
  for (const p of allPermissions.value) {
    const [prefix, action] = p.name.split('.')
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push({ action, permission: p })
  }
  return groups
})

const groupNames = computed(() => Object.keys(permissionGroups.value).sort())

const selectedGroup = ref('')

function groupCounts(group: string) {
  const entries = permissionGroups.value[group] ?? []
  const total = entries.length
  const checked = entries.filter((e) => formPermissionIds.value.has(e.permission.id)).length
  return { checked, total }
}

// selected group's permissions indexed by action, for the checkbox-matrix row
const selectedGroupActions = computed(() => {
  const entries = permissionGroups.value[selectedGroup.value] ?? []
  const byAction: Record<string, Permission | undefined> = {}
  for (const e of entries) byAction[e.action] = e.permission
  return byAction
})

async function fetchPermissions() {
  const res = await useApi<{ data: Permission[] }>('/api/v1/admin/permissions', { query: { perPage: 100 } })
  allPermissions.value = res.data
}

function openCreate() {
  editing.value = null
  formName.value = ''
  formPermissionIds.value = new Set()
  formError.value = ''
  selectedGroup.value = groupNames.value[0] ?? ''
  showFormModal.value = true
}

async function openEdit(row: Role) {
  editing.value = row
  formName.value = row.name
  formError.value = ''
  const res = await useApi<{ data: { permissionIds: string[] } }>(`/api/v1/admin/roles/${row.id}`)
  formPermissionIds.value = new Set(res.data.permissionIds)
  selectedGroup.value = groupNames.value[0] ?? ''
  showFormModal.value = true
}

function togglePermission(id: string, checked: boolean) {
  if (checked) formPermissionIds.value.add(id)
  else formPermissionIds.value.delete(id)
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body = { name: formName.value, permissionIds: [...formPermissionIds.value] }
    if (editing.value) {
      await useApi(`/api/v1/admin/roles/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Role updated')
    } else {
      await useApi('/api/v1/admin/roles', { method: 'POST', body })
      toast.success('Role created')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save role'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Role) {
  const ok = await confirm({
    title: 'Delete role?',
    text: `"${row.name}" will be permanently removed.`,
    confirmText: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/admin/roles/${row.id}`, { method: 'DELETE' })
    toast.success('Role deleted')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Failed to delete role')
  }
}

onMounted(async () => {
  await Promise.all([dataTable.fetch(), fetchPermissions()])
})
</script>

<template>
  <div>
    <UiPageHeader title="Role" breadcrumb="Auth / Role">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ New Role</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Search by name"
        class="text-xs px-2.5 py-1.5 rounded-lg border border-line bg-white text-ink flex-1 max-w-[280px]"
      />
    </UiFilterBar>

    <UiCardTable>
      <UiDataTable
        :columns="columns"
        :rows="dataTable.rows.value"
        :sorting="dataTable.sorting.value"
        @update:sorting="dataTable.setSorting"
      >
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            @edit="openEdit(row)"
            @delete="onDelete(row)"
          />
        </template>
      </UiDataTable>

      <UiPagination
        :from="dataTable.total.value === 0 ? 0 : (dataTable.page.value - 1) * dataTable.perPage.value + 1"
        :to="Math.min(dataTable.page.value * dataTable.perPage.value, dataTable.total.value)"
        :total="dataTable.total.value"
        :per-page="dataTable.perPage.value"
        @prev="dataTable.prev"
        @next="dataTable.next"
        @update:per-page="dataTable.setPerPage"
      />
    </UiCardTable>

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Role' : 'New Role'" size="2xl">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Name">
            <input
              v-model="formName"
              type="text"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Permissions">
            <div class="flex items-start border border-line rounded-lg overflow-hidden bg-white">
              <!-- left: resource groups with checked/total badge -->
              <div class="w-[160px] shrink-0 border-r border-line max-h-[200px] overflow-y-auto">
                <button
                  v-for="group in groupNames"
                  :key="group"
                  type="button"
                  class="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[11px] capitalize text-left"
                  :class="
                    selectedGroup === group
                      ? 'bg-gradient-to-r from-topbar-1 to-topbar-2 text-white font-semibold'
                      : 'text-ink hover:bg-[#FAFAFA]'
                  "
                  @click="selectedGroup = group"
                >
                  <span class="truncate">{{ group }}</span>
                  <span
                    class="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                    :class="selectedGroup === group ? 'bg-white/25 text-white' : 'bg-topbar-1 text-white'"
                  >
                    {{ groupCounts(group).checked }}/{{ groupCounts(group).total }}
                  </span>
                </button>
              </div>

              <!-- right: action checkbox matrix for the selected group -->
              <div class="flex-1 min-w-0 max-h-[200px] overflow-y-auto p-2.5">
                <div class="text-[11px] font-bold text-ink capitalize mb-1.5">{{ selectedGroup }} Permissions</div>
                <div class="overflow-x-auto">
                  <table class="border-collapse text-[11.5px] whitespace-nowrap w-full">
                    <thead>
                      <tr class="text-left text-ink-soft bg-[#FAFAFA]">
                        <th class="px-3 py-1.5 font-semibold">Feature</th>
                        <th v-for="action in ACTION_COLUMNS" :key="action" class="px-5 py-1.5 font-semibold text-center uppercase">
                          {{ action }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-t border-line">
                        <td class="px-3 py-2 font-medium text-ink capitalize">{{ selectedGroup }}</td>
                        <td v-for="action in ACTION_COLUMNS" :key="action" class="px-5 py-2 text-center">
                          <input
                            v-if="selectedGroupActions[action]"
                            type="checkbox"
                            class="w-3.5 h-3.5 rounded-md border-line text-topbar-1"
                            :checked="formPermissionIds.has(selectedGroupActions[action]!.id)"
                            @change="togglePermission(selectedGroupActions[action]!.id, ($event.target as HTMLInputElement).checked)"
                          />
                          <span v-else class="text-ink-soft/40" title="Not available for this resource">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </UiFormField>

          <p v-if="formError" class="text-red-600 text-xs mb-3">{{ formError }}</p>
        </form>
      </UiCardForm>
      <template #footer>
        <UiButton variant="secondary" @click="showFormModal = false">Cancel</UiButton>
        <UiButton variant="primary" :loading="saving" @click="onSubmit">Save</UiButton>
      </template>
    </UiModal>
  </div>
</template>
