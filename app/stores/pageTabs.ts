import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { findNavEntry } from '~/config/navigation'

export interface PageTab {
  path: string
  title: string
  fullPath: string
  icon: string
}

const STORAGE_KEY = 'baseque:page-tabs'
const HOME_TAB: PageTab = { path: '/', title: 'Dashboard', fullPath: '/', icon: 'LayoutDashboard' }
const EXCLUDED_PATHS = ['/login']

/**
 * Browser/VS-Code-style persistent tabs — one per visited route, stays open until
 * closed. Core behavior only (no drag-reorder/context-menu/split-view). Paired with
 * app.vue's <keep-alive> so switching tabs preserves each page's component state.
 */
export const usePageTabsStore = defineStore('pageTabs', () => {
  const tabs = ref<PageTab[]>([HOME_TAB])
  const activeTabPath = ref('/')

  function isActive(path: string) {
    return activeTabPath.value === path
  }

  function openTab(path: string, fullPath: string) {
    if (EXCLUDED_PATHS.includes(path)) return

    const getDynamicTitle = (p: string, fp: string): string | undefined => {
      if (p === '/master/employees/new') {
        const typeMatch = fp.match(/[?&]type=([^&]+)/)
        const qType = typeMatch ? typeMatch[1] : null
        if (qType === 'freelance') return 'Add Freelance'
        if (qType === 'internship') return 'Add Internship'
        return 'Add Employee'
      }
      if (p.startsWith('/master/employees/') && p.endsWith('/edit')) {
        return 'Edit Employee'
      }
      if (p.startsWith('/master/employees/') && !p.endsWith('/edit')) {
        return 'Profile'
      }
      if (p === '/hr/permission/new') {
        return 'Add Permission'
      }
      if (p.startsWith('/hr/permission/') && p.endsWith('/edit')) {
        return 'Edit Permission'
      }
      if (p === '/hr/resignation/new') {
        return 'Add Resignation'
      }
      if (p.startsWith('/hr/resignation/') && p.endsWith('/edit')) {
        return 'Edit Resignation'
      }
      if (p.startsWith('/hr/resignation/') && !p.endsWith('/edit')) {
        return 'Show Resignation Form'
      }
      if (p === '/hr/shift-schedule/scheduling/new') {
        return 'Add Scheduling'
      }
      if (p.startsWith('/hr/shift-schedule/scheduling/') && p.endsWith('/edit')) {
        return 'Edit Scheduling'
      }
      if (p === '/hr/shift-schedule/adjustment/new') {
        return 'Add Schedule Adjustment'
      }
      if (p.startsWith('/hr/shift-schedule/adjustment/') && p.endsWith('/edit')) {
        return 'Edit Schedule Adjustment'
      }
      if (p === '/hr/shift-schedule/manual/new') {
        return 'Add Manual Attendance'
      }
      if (p.startsWith('/hr/shift-schedule/manual/') && p.endsWith('/edit')) {
        return 'Edit Manual Attendance'
      }
      return undefined
    }

    const existing = tabs.value.find((t: PageTab) => t.path === path)
    if (existing) {
      existing.fullPath = fullPath
      const dynamicTitle = getDynamicTitle(path, fullPath)
      if (dynamicTitle) {
        existing.title = dynamicTitle
      }
    } else {
      const nav = findNavEntry(path)
      const dynamicTitle = getDynamicTitle(path, fullPath)
      tabs.value.push({
        path,
        fullPath,
        title: dynamicTitle ?? nav?.label ?? path.split('/').filter(Boolean).pop() ?? path,
        icon: nav?.icon ?? 'FileText',
      })
    }
    activeTabPath.value = path
  }

  function closeTab(path: string): string | undefined {
    if (path === '/') return undefined // home tab is pinned, non-closable

    const index = tabs.value.findIndex((t: PageTab) => t.path === path)
    if (index === -1) return undefined

    tabs.value.splice(index, 1)

    if (activeTabPath.value === path) {
      const next = tabs.value[index] ?? tabs.value[index - 1] ?? HOME_TAB
      activeTabPath.value = next.path
      return next.fullPath
    }
    return undefined
  }

  function persist() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs: tabs.value, activeTabPath: activeTabPath.value }))
  }

  function hydrate() {
    if (!import.meta.client) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { tabs: PageTab[]; activeTabPath: string }
      const restored = (parsed.tabs ?? []).filter(
        (t) => typeof t.path === 'string' && !EXCLUDED_PATHS.includes(t.path)
      )
      if (!restored.some((t) => t.path === '/')) restored.unshift(HOME_TAB)
      tabs.value = restored
      activeTabPath.value = restored.some((t) => t.path === parsed.activeTabPath) ? parsed.activeTabPath : '/'
    } catch {
      // corrupt/old-shape storage — ignore and keep the default single Home tab
    }
  }

  watch([tabs, activeTabPath], persist, { deep: true })

  return { tabs, activeTabPath, isActive, openTab, closeTab, hydrate }
})
