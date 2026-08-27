export interface NavChild {
  label: string
  to: string
}

export interface NavItemConfig {
  label: string
  icon: string
  to?: string
  badge?: number
  children?: NavChild[]
}

export interface NavGroupConfig {
  label: string
  items: NavItemConfig[]
}

export interface FlatNavEntry {
  label: string
  to: string
}

export const navigation: NavGroupConfig[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: 'LayoutDashboard', to: '/' },
      { label: 'Global Approval', icon: 'CircleCheck', to: '/global-approval' },
      { label: 'About GII Commerce', icon: 'Zap', to: '/about' },
    ],
  },
  {
    label: 'Master',
    items: [
      {
        label: 'HR Data',
        icon: 'Users',
        children: [
          { label: 'Employee Database', to: '/master/employees' },
          { label: 'PT', to: '/master/pt' },
          { label: 'Department', to: '/master/department' },
          { label: 'Division', to: '/master/division' },
          { label: 'Team', to: '/master/team' },
          { label: 'Position', to: '/master/position' },
          { label: 'Level', to: '/master/level' },
          { label: 'Bank', to: '/master/banks' },
          { label: 'Shift Schedule', to: '/master/shift-schedule' },
          { label: 'Permission Category', to: '/master/permission-category' },
          { label: 'Holidays', to: '/master/holidays' },
          { label: 'Export Salary', to: '/master/export-salary' },
          { label: 'Legality', to: '/master/legality' },
        ],
      },
    ],
  },
  {
    label: 'HR',
    items: [
      {
        label: 'Permissions',
        icon: 'Square',
        children: [
          { label: 'Paid Leave List', to: '/hr/leave' },
          { label: 'Resignation List', to: '/hr/resignation' },
          { label: 'Permission List', to: '/hr/permission' },
        ],
      },
      {
        label: 'Shift Schedule',
        icon: 'Circle',
        children: [
          { label: 'Scheduling', to: '/hr/shift-schedule/scheduling' },
          { label: 'Schedule Adjustment', to: '/hr/shift-schedule/adjustment' },
          { label: 'Manual Attendance', to: '/hr/shift-schedule/manual' },
          { label: 'Attendance', to: '/hr/attendance' },
          { label: 'Shift Display', to: '/hr/shift-schedule/display' },
        ],
      },
      {
        label: 'Form',
        icon: 'FileText',
        children: [{ label: 'Form List', to: '/hr/form' }],
      },
      {
        label: 'HR Process',
        icon: 'Repeat',
        children: [{ label: 'HR Process List', to: '/hr/process' }],
      },
      {
        label: 'Report',
        icon: 'FileText',
        children: [{ label: 'Report List', to: '/hr/report' }],
      },
      {
        label: 'Room',
        icon: 'MapPin',
        children: [
          { label: 'Room', to: '/hr/room' },
          { label: 'Room Reservation', to: '/hr/room-reservation' },
        ],
      },
      {
        label: 'Asset',
        icon: 'Briefcase',
        children: [
          { label: 'Asset List', to: '/hr/asset' },
          { label: 'Asset Requests', to: '/hr/asset-request' },
          { label: 'Asset Depreciation', to: '/hr/asset/depreciation' },
        ],
      },
    ],
  },
  {
    label: 'Option',
    items: [{ label: 'System', icon: 'Settings', to: '/system' }],
  },
  {
    label: 'Auth',
    items: [
      { label: 'User Permission', icon: 'Square', to: '/auth/permissions' },
      { label: 'Role', icon: 'ShieldCheck', to: '/auth/roles' },
      { label: 'User', icon: 'Users', to: '/auth/users' },
    ],
  },
  {
    label: 'Docs',
    items: [
      { label: 'Components', icon: 'BookOpen', to: '/docs/components' },
      { label: 'API Endpoints', icon: 'Code', to: '/docs/api' },
    ],
  },
]

export function flattenNavigation(): FlatNavEntry[] {
  const entries: FlatNavEntry[] = []
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.to) entries.push({ label: item.label, to: item.to })
      for (const child of item.children ?? []) {
        entries.push({ label: `${item.label} · ${child.label}`, to: child.to })
      }
    }
  }
  return entries
}

/** Looks up the label + icon for a route path — used by the page-tabs bar. */
export function findNavEntry(path: string): { label: string; icon: string } | undefined {
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.to === path) return { label: item.label, icon: item.icon }
      for (const child of item.children ?? []) {
        if (child.to === path) return { label: child.label, icon: item.icon }
      }
    }
  }
  return undefined
}
