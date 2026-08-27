import type { Ref } from 'vue'
import type { SortingState } from '@tanstack/vue-table'

export interface DataTableFetchParams {
  page: number
  perPage: number
  search: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface DataTableFetchResult<T> {
  data: T[]
  meta: { page: number; perPage: number; total: number }
}

/**
 * Generic server-driven table state: pagination, sorting, and (optionally, via the
 * `search` option) filter text — wired to `UiDataTable`/`UiPagination`. One instance
 * per list page instead of each page re-implementing fetch/loading/pagination by hand.
 */
export function useDataTable<T>(
  fetcher: (params: DataTableFetchParams) => Promise<DataTableFetchResult<T>>,
  options?: { defaultPerPage?: number; defaultSort?: SortingState; search?: Ref<string> }
) {
  const rows = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const perPage = ref(options?.defaultPerPage ?? 10)
  const total = ref(0)
  const sorting = ref<SortingState>(options?.defaultSort ?? [])
  const search = options?.search ?? ref('')

  async function fetch() {
    loading.value = true
    error.value = ''
    try {
      const sort = sorting.value[0]
      const res = await fetcher({
        page: page.value,
        perPage: perPage.value,
        search: search.value,
        sortBy: sort?.id,
        sortDir: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
      })
      rows.value = res.data
      total.value = res.meta.total
    } catch (e: any) {
      error.value = e?.data?.statusMessage || 'Failed to load data'
    } finally {
      loading.value = false
    }
  }

  function prev() {
    if (page.value > 1) {
      page.value -= 1
      fetch()
    }
  }

  function next() {
    if (page.value * perPage.value < total.value) {
      page.value += 1
      fetch()
    }
  }

  function setPerPage(size: number) {
    perPage.value = size
    page.value = 1
    fetch()
  }

  function setSorting(next: SortingState) {
    sorting.value = next
    page.value = 1
    fetch()
  }

  return {
    rows,
    loading,
    error,
    page,
    perPage,
    total,
    sorting,
    fetch,
    refresh: fetch,
    prev,
    next,
    setPerPage,
    setSorting,
  }
}
