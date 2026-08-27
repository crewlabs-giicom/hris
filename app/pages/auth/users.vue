<script setup lang="ts">
import { toast } from 'vue-sonner'
import { refDebounced } from '@vueuse/core'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

import { UserX } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

interface User {
  id: string
  email: string
  username: string | null
  isActive: boolean
  createdAt: string
  roles: string[]
}

interface Role {
  id: string
  name: string
}

const columns: DataTableColumn[] = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'username', label: 'Username' },
  { key: 'roles', label: 'Roles' },
  { key: 'isActive', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created At', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<User>(
  (params) => useApi('/api/v1/admin/users', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'createdAt', desc: true }] }
)
const { confirm } = useConfirm()

const allRoles = ref<Role[]>([])

const showFormModal = ref(false)
const editing = ref<User | null>(null)
const formEmail = ref('')
const formUsername = ref('')
const formPassword = ref('')
const formIsActive = ref(true)
const formRoleIds = ref<Set<string>>(new Set())
const formError = ref('')
const saving = ref(false)

const originalUsername = ref('')
const usernameStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const debouncedUsername = refDebounced(formUsername, 400)

watch(debouncedUsername, async (value) => {
  const trimmed = value.trim()
  if (!trimmed || trimmed === originalUsername.value) {
    usernameStatus.value = 'idle'
    return
  }
  if (trimmed.length < 3) {
    usernameStatus.value = 'idle'
    return
  }
  usernameStatus.value = 'checking'
  try {
    const query: Record<string, string> = { username: trimmed }
    if (editing.value) query.excludeUserId = editing.value.id
    const res = await useApi<{ available: boolean }>('/api/v1/admin/users/check-username', { query })
    usernameStatus.value = res.available ? 'available' : 'taken'
  } catch {
    usernameStatus.value = 'idle'
  }
})

const canSubmit = computed(() => usernameStatus.value !== 'checking' && usernameStatus.value !== 'taken')

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

async function fetchRoles() {
  const res = await useApi<{ data: Role[] }>('/api/v1/admin/roles', { query: { perPage: 100 } })
  allRoles.value = res.data
}

function openCreate() {
  editing.value = null
  formEmail.value = ''
  formUsername.value = ''
  originalUsername.value = ''
  usernameStatus.value = 'idle'
  formPassword.value = ''
  formIsActive.value = true
  formRoleIds.value = new Set()
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: User) {
  editing.value = row
  formEmail.value = row.email
  formUsername.value = row.username ?? ''
  originalUsername.value = row.username ?? ''
  usernameStatus.value = 'idle'
  formPassword.value = ''
  formIsActive.value = row.isActive
  formRoleIds.value = new Set(allRoles.value.filter((r) => row.roles.includes(r.name)).map((r) => r.id))
  formError.value = ''
  showFormModal.value = true
}

function toggleRole(id: string, checked: boolean) {
  if (checked) formRoleIds.value.add(id)
  else formRoleIds.value.delete(id)
}

async function onSubmit() {
  if (!canSubmit.value) return
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      const body: Record<string, unknown> = {
        email: formEmail.value,
        username: formUsername.value || undefined,
        isActive: formIsActive.value,
        roleIds: [...formRoleIds.value],
      }
      if (formPassword.value) body.password = formPassword.value
      await useApi(`/api/v1/admin/users/${editing.value.id}`, { method: 'PUT', body })
      toast.success('User updated')
    } else {
      await useApi('/api/v1/admin/users', {
        method: 'POST',
        body: {
          email: formEmail.value,
          username: formUsername.value || undefined,
          password: formPassword.value,
          isActive: formIsActive.value,
          roleIds: [...formRoleIds.value],
        },
      })
      toast.success('User created')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save user'
  } finally {
    saving.value = false
  }
}

async function onDeactivate(row: User) {
  const ok = await confirm({
    title: 'Deactivate user?',
    text: `"${row.email}" will no longer be able to sign in.`,
    confirmText: 'Deactivate',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/admin/users/${row.id}`, { method: 'DELETE' })
    toast.success('User deactivated')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Failed to deactivate user')
  }
}

onMounted(async () => {
  await Promise.all([dataTable.fetch(), fetchRoles()])
})
</script>

<template>
  <div>
    <UiPageHeader title="User" breadcrumb="Auth / User">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ New User</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Search by email"
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
        <template #cell-roles="{ value }">
          {{ (value as string[]).join(', ') || '-' }}
        </template>
        <template #cell-isActive="{ value }">
          <UiStatusChip :variant="value ? 'active' : 'inactive'" :label="value ? 'Active' : 'Inactive'" />
        </template>
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            :delete-action="false"
            @edit="openEdit(row)"
          >
            <button
              v-if="row.isActive"
              type="button"
              class="w-full text-left px-3 py-1.5 text-[11px] text-red-600 hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
              @click="onDeactivate(row)"
            >
              <UserX class="w-3.5 h-3.5 text-red-500" />
              <span>Deactivate</span>
            </button>
          </UiTableActions>
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit User' : 'New User'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Email">
            <input
              v-model="formEmail"
              type="email"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Username">
            <input
              v-model="formUsername"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
            <p v-if="usernameStatus === 'checking'" class="text-[11px] text-ink-soft mt-1">Mengecek ketersediaan...</p>
            <p v-else-if="usernameStatus === 'available'" class="text-[11px] text-ok mt-1">✓ Tersedia</p>
            <p v-else-if="usernameStatus === 'taken'" class="text-[11px] text-red-600 mt-1">✗ Sudah dipakai</p>
          </UiFormField>

          <UiFormField :label="editing ? 'Password (leave blank to keep unchanged)' : 'Password'">
            <input
              v-model="formPassword"
              type="password"
              :required="!editing"
              minlength="8"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Status">
            <UiCheckbox v-model="formIsActive" label="Active" />
          </UiFormField>

          <UiFormField label="Roles">
            <div class="border border-line rounded-lg p-3 bg-white">
              <UiCheckbox
                v-for="r in allRoles"
                :key="r.id"
                :model-value="formRoleIds.has(r.id)"
                :label="r.name"
                class="mb-1.5"
                @update:model-value="(v) => toggleRole(r.id, v)"
              />
            </div>
          </UiFormField>

          <p v-if="formError" class="text-red-600 text-xs mb-3">{{ formError }}</p>
        </form>
      </UiCardForm>
      <template #footer>
        <UiButton variant="secondary" @click="showFormModal = false">Cancel</UiButton>
        <UiButton variant="primary" :loading="saving" :disabled="!canSubmit" @click="onSubmit">Save</UiButton>
      </template>
    </UiModal>
  </div>
</template>
