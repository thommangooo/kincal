'use client'

import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

export interface GlobalFilters {
  search: string
  districtId: string
  zoneId: string
  clubId: string
  visibility: 'all' | 'public' | 'private' | 'internal-use'
  includeZoneEvents?: boolean
  includeClubEvents?: boolean
}

interface FilterContextType {
  filters: GlobalFilters
  setFilters: (filters: GlobalFilters) => void
  clearFilters: () => void
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const defaultFilters: GlobalFilters = {
  search: '',
  districtId: '',
  zoneId: '',
  clubId: '',
  visibility: 'all',
  includeZoneEvents: true,
  includeClubEvents: true
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters)

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const updateFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    clearFilters,
    updateFilter
  }), [filters])

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}
