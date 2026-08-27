export function useSidebar() {
  const collapsed = useCookie<boolean>('sidebar-collapsed', { default: () => false })
  // Mobile drawer open/closed — deliberately not persisted (cookie), it should always start
  // closed on a fresh page load regardless of what the user last did on a small screen.
  const mobileOpen = useState('sidebar-mobile-open', () => false)

  function toggle() {
    // Below the `lg` breakpoint the sidebar is an off-canvas drawer, not a collapsible rail —
    // the same hamburger button in TopBar drives both behaviors depending on screen size.
    if (import.meta.client && window.innerWidth < 1024) {
      mobileOpen.value = !mobileOpen.value
    } else {
      collapsed.value = !collapsed.value
    }
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  return { collapsed, mobileOpen, toggle, closeMobile }
}
