import { refDebounced } from '@vueuse/core'

/**
 * Generic filter state for a list page — kept separate from useDataTable so it can be
 * reused on non-table pages too. `search` binds directly to the input (immediate),
 * `debouncedSearch` is what pages should watch to trigger a re-fetch.
 */
export function useTableFilter(options?: { debounce?: number }) {
  const search = ref('')
  const debouncedSearch = refDebounced(search, options?.debounce ?? 300)

  function reset() {
    search.value = ''
  }

  return { search, debouncedSearch, reset }
}
