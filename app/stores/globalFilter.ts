import { defineStore } from 'pinia'

export const useGlobalFilterStore = defineStore('globalFilter', () => {
  const status = ref<string>('')
  const companyId = ref<string>('')
  const teamId = ref<string>('')
  const positionId = ref<string>('')
  
  const currentMonth = String(new Date().getMonth() + 1)
  const currentYear = String(new Date().getFullYear())
  
  const month = ref<string>(currentMonth)
  const year = ref<string>(currentYear)

  function clearFilters() {
    status.value = ''
    companyId.value = ''
    teamId.value = ''
    positionId.value = ''
    month.value = currentMonth
    year.value = currentYear
  }

  return {
    status,
    companyId,
    teamId,
    positionId,
    month,
    year,
    clearFilters,
  }
})
