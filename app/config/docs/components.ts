export interface DocProp {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

export interface DocEntry {
  name: string
  category: 'ui' | 'layout' | 'composable' | 'store'
  path: string
  description: string
  props?: DocProp[]
  slots?: { name: string; description: string; scope?: string }[]
  emits?: { name: string; payload: string; description: string }[]
  returns?: { name: string; type: string; description: string }[]
  example: string
}

export const componentDocs: DocEntry[] = [
  // ---- UI components ----
  {
    name: 'UiPageHeader',
    category: 'ui',
    path: 'app/components/ui/PageHeader.vue',
    description: 'Page title + breadcrumb row with a right-aligned #actions slot, used at the top of every admin page.',
    props: [
      { name: 'title', type: 'string', required: true },
      { name: 'breadcrumb', type: 'string' },
    ],
    slots: [{ name: 'actions', description: 'Right-aligned buttons (e.g. "+ New User").' }],
    example: `<UiPageHeader title="User" breadcrumb="Auth / User">
  <template #actions>
    <UiButton variant="primary">+ New User</UiButton>
  </template>
</UiPageHeader>`,
  },
  {
    name: 'UiFilterBar',
    category: 'ui',
    path: 'app/components/ui/FilterBar.vue',
    description: 'Flex row wrapper for filter controls (search input, selects) above a table.',
    slots: [{ name: 'default', description: 'Filter controls, laid out in a row with gap.' }],
    example: `<UiFilterBar>
  <input v-model="filter.search.value" placeholder="Search by email" />
</UiFilterBar>`,
  },
  {
    name: 'UiCard',
    category: 'ui',
    path: 'app/components/ui/Card.vue',
    description: 'Generic bordered/rounded white container. Used for static content blocks (e.g. global-approval.vue). For tables/forms prefer UiCardTable/UiCardForm instead.',
    slots: [{ name: 'default', description: 'Card content.' }],
    example: `<UiCard>
  <p>Any content</p>
</UiCard>`,
  },
  {
    name: 'UiCardTable',
    category: 'ui',
    path: 'app/components/ui/CardTable.vue',
    description: 'Card variant for list pages — adds a colored top accent border and an optional header row, to visually distinguish table cards from form cards.',
    props: [{ name: 'title', type: 'string', description: 'Optional header title shown left of the #header slot.' }],
    slots: [{ name: 'header', description: 'Right side of the header row (e.g. extra actions).' }, { name: 'default', description: 'Table + pagination content.' }],
    example: `<UiCardTable>
  <UiDataTable :columns="columns" :rows="rows" />
  <UiPagination :from="1" :to="10" :total="42" />
</UiCardTable>`,
  },
  {
    name: 'UiCardForm',
    category: 'ui',
    path: 'app/components/ui/CardForm.vue',
    description: 'Card variant for forms — light gray background section, used inside UiModal to visually separate the form from the modal chrome.',
    slots: [{ name: 'default', description: 'Form fields.' }],
    example: `<UiModal v-model="show" title="New User">
  <UiCardForm>
    <form>...</form>
  </UiCardForm>
</UiModal>`,
  },
  {
    name: 'UiTabs',
    category: 'ui',
    path: 'app/components/ui/Tabs.vue',
    description: 'Simple underline-style tab bar bound with v-model.',
    props: [
      { name: 'tabs', type: 'string[]', required: true },
      { name: 'modelValue', type: 'string', required: true },
    ],
    emits: [{ name: 'update:modelValue', payload: 'string', description: 'Fired when a tab is clicked.' }],
    example: `<UiTabs v-model="activeTab" :tabs="['Approval', 'History']" />`,
  },
  {
    name: 'UiFormField',
    category: 'ui',
    path: 'app/components/ui/FormField.vue',
    description: 'Label + input wrapper with an inline error message slot below the input.',
    props: [
      { name: 'label', type: 'string', required: true },
      { name: 'error', type: 'string' },
    ],
    slots: [{ name: 'default', description: 'The actual input element.' }],
    example: `<UiFormField label="Email" :error="formError">
  <input v-model="email" type="email" />
</UiFormField>`,
  },
  {
    name: 'UiButton',
    category: 'ui',
    path: 'app/components/ui/Button.vue',
    description: 'Themed button — primary uses the topbar orange gradient, secondary is bordered white, danger is solid red.',
    props: [
      { name: 'variant', type: "'primary' | 'secondary' | 'danger'", default: "'secondary'" },
      { name: 'loading', type: 'boolean', default: 'false' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'type', type: "'button' | 'submit'", default: "'button'" },
    ],
    slots: [{ name: 'default', description: 'Button label (falls back to "Memproses..." when loading with no slot content).' }],
    example: `<UiButton variant="primary" :loading="saving" @click="onSubmit">Save</UiButton>`,
  },
  {
    name: 'UiPagination',
    category: 'ui',
    path: 'app/components/ui/Pagination.vue',
    description: '"Showing X to Y of Z entries" row with Previous/Next buttons and an optional per-page size selector.',
    props: [
      { name: 'from', type: 'number', required: true },
      { name: 'to', type: 'number', required: true },
      { name: 'total', type: 'number', required: true },
      { name: 'perPage', type: 'number', description: 'Omit to hide the page-size dropdown entirely.' },
    ],
    emits: [
      { name: 'prev', payload: '—', description: 'Previous page clicked.' },
      { name: 'next', payload: '—', description: 'Next page clicked.' },
      { name: 'update:perPage', payload: 'number', description: 'Page size changed (10/25/50/100).' },
    ],
    example: `<UiPagination
  :from="1" :to="10" :total="42" :per-page="10"
  @prev="dataTable.prev" @next="dataTable.next" @update:per-page="dataTable.setPerPage"
/>`,
  },
  {
    name: 'UiCheckbox',
    category: 'ui',
    path: 'app/components/ui/Checkbox.vue',
    description: 'Styled checkbox with an inline label.',
    props: [
      { name: 'modelValue', type: 'boolean', required: true },
      { name: 'label', type: 'string', required: true },
    ],
    emits: [{ name: 'update:modelValue', payload: 'boolean', description: 'Checked state changed.' }],
    example: `<UiCheckbox v-model="formIsActive" label="Active" />`,
  },
  {
    name: 'UiStatusChip',
    category: 'ui',
    path: 'app/components/ui/StatusChip.vue',
    description: 'Small pill badge. "ok"/"active" render green, "warn"/"inactive" render amber.',
    props: [
      { name: 'variant', type: "'ok' | 'warn' | 'active' | 'inactive'", required: true },
      { name: 'label', type: 'string', required: true },
    ],
    example: `<UiStatusChip :variant="user.isActive ? 'active' : 'inactive'" :label="user.isActive ? 'Active' : 'Inactive'" />`,
  },
  {
    name: 'UiModal',
    category: 'ui',
    path: 'app/components/ui/Modal.vue',
    description: 'Teleported dialog with backdrop-fade + panel scale-fade transitions. Closes on backdrop click or Esc.',
    props: [
      { name: 'modelValue', type: 'boolean', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'size', type: "'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Panel max-width: 440px / 720px / 920px / 1180px. Use lg+ for wider content like the Role permission-matrix editor.' },
    ],
    emits: [{ name: 'update:modelValue', payload: 'boolean', description: 'Fired on close.' }],
    slots: [
      { name: 'default', description: 'Modal body.' },
      { name: 'footer', description: 'Action buttons row (only rendered if provided).' },
    ],
    example: `<UiModal v-model="showFormModal" :title="editing ? 'Edit Role' : 'New Role'" size="2xl">
  <UiCardForm>...</UiCardForm>
  <template #footer>
    <UiButton variant="secondary" @click="showFormModal = false">Cancel</UiButton>
    <UiButton variant="primary" @click="onSubmit">Save</UiButton>
  </template>
</UiModal>`,
  },
  {
    name: 'UiDataTable',
    category: 'ui',
    path: 'app/components/ui/DataTable.vue',
    description: 'Server-driven data table built on @tanstack/vue-table (headless — state only, markup stays custom Tailwind). Sortable columns toggle via header click. If the #row-actions slot is provided, an Action dropdown column is automatically injected as the first column and teleported to <body> (fixed-positioned from the trigger) so it is never clipped by table/card overflow.',
    props: [
      { name: 'columns', type: 'DataTableColumn[]', required: true, description: '{ key, label, align?, sortable? }[]' },
      { name: 'rows', type: 'Record<string, any>[]', required: true },
      { name: 'sorting', type: 'SortingState', description: 'TanStack sort state, e.g. [{ id: "name", desc: false }]. Omit for an unsorted/static table.' },
    ],
    emits: [{ name: 'update:sorting', payload: 'SortingState', description: 'Fired when a sortable header is clicked.' }],
    slots: [
      { name: 'cell-<key>', description: 'Custom cell renderer per column key.', scope: '{ row, value }' },
      { name: 'row-actions', description: 'Menu content for the auto-injected Action dropdown (omit to disable the dropdown entirely).', scope: '{ row }' },
    ],
    example: `<UiDataTable :columns="columns" :rows="dataTable.rows.value" :sorting="dataTable.sorting.value" @update:sorting="dataTable.setSorting">
  <template #cell-isActive="{ value }">
    <UiStatusChip :variant="value ? 'active' : 'inactive'" :label="value ? 'Active' : 'Inactive'" />
  </template>
  <template #row-actions="{ row }">
    <button @click="openEdit(row)">Edit</button>
  </template>
</UiDataTable>`,
  },

  // ---- Layout components ----
  {
    name: 'LayoutAppShell',
    category: 'layout',
    path: 'app/components/layout/AppShell.vue',
    description: 'Top-level authenticated shell: TopBar + Sidebar + PageTabsBar + scrollable main content area. Wraps every page via app/layouts/default.vue. Reads collapsed state from useSidebar(), and opens/hydrates the page-tabs store on route change.',
    slots: [{ name: 'default', description: 'Page content (provided by NuxtPage via the default layout).' }],
    example: `<!-- app/layouts/default.vue -->
<template>
  <LayoutAppShell>
    <slot />
  </LayoutAppShell>
</template>`,
  },
  {
    name: 'LayoutTopBar',
    category: 'layout',
    path: 'app/components/layout/TopBar.vue',
    description: 'Fixed-height header with the orange gradient brand background, sidebar-toggle button, global nav search (filters flattenNavigation()), and UserMenu/NotificationMenu on the right.',
    props: [{ name: 'collapsed', type: 'boolean', required: true }],
    emits: [{ name: 'toggle-sidebar', payload: '—', description: 'Sidebar collapse button clicked.' }],
    example: `<LayoutTopBar :collapsed="collapsed" @toggle-sidebar="toggle" />`,
  },
  {
    name: 'LayoutSidebar',
    category: 'layout',
    path: 'app/components/layout/Sidebar.vue',
    description: 'Dark navigation rail, renders one LayoutNavGroup per entry in navigation.ts. Width animates between full (210px) and collapsed (56px).',
    props: [{ name: 'collapsed', type: 'boolean', required: true }],
    example: `<LayoutSidebar :collapsed="collapsed" />`,
  },
  {
    name: 'LayoutNavGroup',
    category: 'layout',
    path: 'app/components/layout/NavGroup.vue',
    description: 'Renders a nav section label (hidden when collapsed) followed by its items — LayoutNavParentItem for items with children, LayoutNavItem for leaf links.',
    props: [
      { name: 'group', type: 'NavGroupConfig', required: true },
      { name: 'collapsed', type: 'boolean', required: true },
    ],
    example: `<LayoutNavGroup v-for="group in navigation" :key="group.label" :group="group" :collapsed="collapsed" />`,
  },
  {
    name: 'LayoutNavParentItem',
    category: 'layout',
    path: 'app/components/layout/NavParentItem.vue',
    description: 'Nav item with children. Collapsed sidebar: icon-only trigger with a hover flyout submenu. Expanded sidebar: click-to-expand accordion with a fade+slide transition on the child list.',
    props: [
      { name: 'item', type: 'NavItemConfig', required: true },
      { name: 'collapsed', type: 'boolean', required: true },
    ],
    example: `<LayoutNavParentItem :item="item" :collapsed="collapsed" />`,
  },
  {
    name: 'LayoutNavItem',
    category: 'layout',
    path: 'app/components/layout/NavItem.vue',
    description: 'Leaf nav link (no children). Highlights when route.path matches item.to. Label fades in/out on sidebar collapse/expand.',
    props: [
      { name: 'item', type: 'NavItemConfig', required: true },
      { name: 'collapsed', type: 'boolean', required: true },
    ],
    example: `<LayoutNavItem :item="{ label: 'Dashboard', icon: 'LayoutDashboard', to: '/' }" :collapsed="false" />`,
  },
  {
    name: 'LayoutPageTabsBar',
    category: 'layout',
    path: 'app/components/layout/PageTabsBar.vue',
    description: 'Browser/VS-Code-style persistent tab strip, sticky directly below TopBar. Reads/drives usePageTabsStore() — no props, fully self-contained. Shows a scroll-left/scroll-right chevron when tabs overflow, a close (X) button per tab on hover (hidden on the pinned Home tab), and supports middle-click to close.',
    example: `<LayoutPageTabsBar />`,
  },
  {
    name: 'LayoutUserMenu',
    category: 'layout',
    path: 'app/components/layout/UserMenu.vue',
    description: 'Topbar-right avatar/email dropdown with Profile link and Logout (calls useAuthStore().logout() then redirects to /login). Closes on outside click via onClickOutside.',
    example: `<LayoutUserMenu />`,
  },
  {
    name: 'LayoutNotificationMenu',
    category: 'layout',
    path: 'app/components/layout/NotificationMenu.vue',
    description: 'Topbar-right bell icon with an unread-count badge and a dropdown list. Currently backed by static placeholder data — no notifications endpoint exists yet.',
    example: `<LayoutNotificationMenu />`,
  },

  // ---- Composables ----
  {
    name: 'useApi',
    category: 'composable',
    path: 'app/composables/useApi.ts',
    description: 'Thin $fetch wrapper that attaches the Bearer access token from useAuthStore(). Use for every authenticated call from admin pages instead of raw $fetch. On a 401 it transparently calls auth.refresh() and retries the request once — logout only happens if that refresh itself fails (i.e. the refresh token is genuinely invalid/expired/revoked), which is the only automatic-logout path in the app.',
    returns: [{ name: '(return value)', type: 'Promise<T>', description: 'Same as $fetch<T>(url, opts), with the Authorization header merged in automatically and 401s retried after a silent token refresh.' }],
    example: `const res = await useApi<{ data: User[] }>('/api/v1/admin/users', { query: { page: 1 } })`,
  },
  {
    name: 'useSidebar',
    category: 'composable',
    path: 'app/composables/useSidebar.ts',
    description: 'Cookie-backed (sidebar-collapsed) collapsed/expanded state for the sidebar, shared between TopBar\'s toggle button and AppShell/Sidebar.',
    returns: [
      { name: 'collapsed', type: 'Ref<boolean>', description: 'Persisted across reloads via cookie.' },
      { name: 'toggle', type: '() => void', description: 'Flips collapsed.value.' },
    ],
    example: `const { collapsed, toggle } = useSidebar()`,
  },
  {
    name: 'useDataTable',
    category: 'composable',
    path: 'app/composables/useDataTable.ts',
    description: 'Generic server-driven table state: pagination, sorting, and rows/loading/error, wired to UiDataTable/UiPagination. One instance per list page instead of re-implementing fetch/pagination by hand. Accepts a fetcher(params) => Promise<{ data, meta }> and an optional external `search` ref (typically useTableFilter().debouncedSearch).',
    returns: [
      { name: 'rows / loading / error', type: 'Ref<T[]> / Ref<boolean> / Ref<string>', description: 'Current page data + request state.' },
      { name: 'page / perPage / total / sorting', type: 'Ref<number> / Ref<number> / Ref<number> / Ref<SortingState>', description: 'Bind directly to UiDataTable/UiPagination.' },
      { name: 'fetch / refresh', type: '() => Promise<void>', description: 'Re-run the fetcher with current page/perPage/search/sorting (refresh is an alias of fetch).' },
      { name: 'prev / next', type: '() => void', description: 'Page navigation — no-ops past the first/last page.' },
      { name: 'setPerPage / setSorting', type: '(v) => void', description: 'Update page size or sort, reset to page 1, and refetch.' },
    ],
    example: `const filter = useTableFilter()
const dataTable = useDataTable<Permission>(
  (params) => useApi('/api/v1/admin/permissions', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
watch(filter.debouncedSearch, () => { dataTable.page.value = 1; dataTable.fetch() })
onMounted(dataTable.fetch)`,
  },
  {
    name: 'useTableFilter',
    category: 'composable',
    path: 'app/composables/useTableFilter.ts',
    description: 'Generic filter state for a list page, kept separate from useDataTable so it can be reused on non-table pages too. search binds directly to the input; debouncedSearch (300ms via @vueuse/core refDebounced) is what pages should watch to trigger a re-fetch.',
    returns: [
      { name: 'search', type: 'Ref<string>', description: 'Bind with v-model to the search input.' },
      { name: 'debouncedSearch', type: 'Ref<string>', description: 'Debounced copy — watch this, not search, to avoid firing a request per keystroke.' },
      { name: 'reset', type: '() => void', description: 'Clears search.' },
    ],
    example: `const filter = useTableFilter({ debounce: 300 })`,
  },
  {
    name: 'useConfirm',
    category: 'composable',
    path: 'app/composables/useConfirm.ts',
    description: 'Themed SweetAlert2 confirm dialog replacing browser confirm(). Confirm button uses the topbar orange gradient by default, or solid red when danger: true.',
    returns: [{ name: 'confirm', type: '(options) => Promise<boolean>', description: 'options: { title, text?, confirmText?, cancelText?, danger? }. Resolves true if confirmed.' }],
    example: `const { confirm } = useConfirm()
const ok = await confirm({ title: 'Delete role?', text: '"admin" will be permanently removed.', confirmText: 'Delete', danger: true })
if (!ok) return`,
  },

  // ---- Pinia stores ----
  {
    name: 'useAuthStore',
    category: 'store',
    path: 'app/stores/auth.ts',
    description: 'Setup-store holding the session — accessToken/refreshToken/user, each backed by useCookie (30-day maxAge, same pattern as useSidebar) instead of plain in-memory state, so the session survives page reload and tab close. Nothing here auto-logs-out on its own; that only happens via an explicit logout() call or useApi\'s retry-on-401 giving up after a failed refresh.',
    returns: [
      { name: 'accessToken / refreshToken / user', type: 'Ref<string|null> / Ref<string|null> / Ref<AuthUser|null>', description: 'Cookie-backed session state.' },
      { name: 'login', type: '(email, password) => Promise<void>', description: 'Calls POST /api/v1/auth/login and populates the cookies above.' },
      { name: 'logout', type: '() => Promise<void>', description: 'Calls POST /api/v1/auth/logout (server-side revoke) then clears all three cookies.' },
      { name: 'refresh', type: '() => Promise<void>', description: 'Calls POST /api/v1/auth/refresh to mint a new accessToken. No-op if refreshToken is empty. Throws if the refresh token is invalid/expired/revoked.' },
    ],
    example: `const auth = useAuthStore()
await auth.login(email.value, password.value)
// ...
await auth.logout()`,
  },
  {
    name: 'usePageTabsStore',
    category: 'store',
    path: 'app/stores/pageTabs.ts',
    description: 'Browser/VS-Code-style persistent tabs — one per visited route, stays open until closed, backing LayoutPageTabsBar. The Home tab (/) is pinned and non-closable. List + active tab persist to localStorage (baseque:page-tabs) and are restored on load — pair with app.vue\'s <KeepAlive> so a page\'s component state (filters, scroll position) survives switching away and back.',
    returns: [
      { name: 'tabs', type: 'Ref<PageTab[]>', description: '{ path, title, fullPath, icon }[] — current open tabs, Home always first.' },
      { name: 'activeTabPath', type: 'Ref<string>', description: 'Path of the currently active tab.' },
      { name: 'isActive', type: '(path) => boolean', description: 'Used by PageTabsBar to style the active tab.' },
      { name: 'openTab', type: '(path, fullPath) => void', description: 'Adds a tab (looked up in navigation.ts for title/icon) or activates an existing one. Called from AppShell on every route change.' },
      { name: 'closeTab', type: '(path) => string | undefined', description: 'Removes a tab (no-op on "/"). Returns the fullPath to navigate to if the closed tab was active, else undefined.' },
      { name: 'hydrate', type: '() => void', description: 'Restores tabs/activeTabPath from localStorage — client-only, called once by AppShell before its route watcher runs.' },
    ],
    example: `const tabsStore = usePageTabsStore()
tabsStore.hydrate()
watch(() => route.fullPath, () => tabsStore.openTab(route.path, route.fullPath), { immediate: true })`,
  },
]
