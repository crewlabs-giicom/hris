import { refDebounced } from '@vueuse/core'

export interface SelectSearchOption {
  id: string
  label: string
}

/**
 * Search-as-you-type + id-resolution for UiSelectSearch. Split out from the component so the
 * fetch/debounce/label-cache logic is reusable/testable independent of the dropdown markup.
 *
 * Two modes:
 *  - `source` is a string -> treated as a server endpoint (existing behaviour): hits
 *    `?search=` for search-as-you-type and `?ids=` (see server/utils/crud.ts) to resolve
 *    labels for values a select already holds (edit mode) without a full search.
 *  - `source` is a plain `{id,label}[]` array -> for fixed/enum-style selects (gender, blood
 *    type, marital status, ...) that have no backing table. Search filters the array locally
 *    instead of hitting the network, so every select in the app can use the same searchable
 *    UiSelectSearch component/UX regardless of whether its options come from the server.
 */
export function useSelectSearchOptions(source: string | SelectSearchOption[], labelKey = 'name') {
  const isStatic = Array.isArray(source)

  const search = ref('')
  const debouncedSearch = refDebounced(search, isStatic ? 0 : 300)
  const options = ref<SelectSearchOption[]>([])
  const loading = ref(false)
  const labelCache = reactive<Record<string, string>>({})

  if (isStatic) {
    for (const opt of source) labelCache[opt.id] = opt.label
  }

  function mapRow(row: Record<string, any>): SelectSearchOption {
    const label = row[labelKey] ?? row.id
    labelCache[row.id] = label
    return { id: row.id, label }
  }

  async function fetchOptions() {
    if (isStatic) {
      const term = debouncedSearch.value.trim().toLowerCase()
      options.value = term ? source.filter((o) => o.label.toLowerCase().includes(term)) : source
      return
    }
    loading.value = true
    try {
      const res = await useApi<{ data: Record<string, any>[] }>(source, {
        query: { search: debouncedSearch.value, perPage: 20 },
      })
      options.value = res.data.map(mapRow)
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  async function resolveLabels(ids: string[]) {
    if (isStatic) return // labelCache already seeded with every option up front
    const missing = ids.filter((id) => id && !(id in labelCache))
    if (!missing.length) return
    try {
      const res = await useApi<{ data: Record<string, any>[] }>(source, {
        query: { ids: missing.join(',') },
      })
      res.data.forEach(mapRow)
    } catch {
      // leave unresolved — component falls back to showing the raw id
    }
  }

  watch(debouncedSearch, fetchOptions)

  return { search, options, loading, labelCache, fetchOptions, resolveLabels }
}
