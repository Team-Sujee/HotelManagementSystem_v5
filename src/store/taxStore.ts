import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TaxRate, TaxScope, UserRole } from '../types'

interface TaxFilters {
  search?: string
  scope?: TaxScope | 'All'
  active?: boolean | 'All'
}

interface TaxState {
  taxes: TaxRate[]
  list: (filters?: TaxFilters) => TaxRate[]
  getById: (id: string) => TaxRate | undefined
  create: (tax: Omit<TaxRate, 'id' | 'createdAt' | 'createdBy' | 'active'>) => TaxRate
  update: (id: string, changes: Partial<TaxRate>) => void
  // Soft-delete by setting active=false; runtime guards elsewhere should prevent deletion when referenced
  remove: (id: string, actorRole?: UserRole) => void
}

export const useTaxStore = create<TaxState>()(
  persist(
    (set, get) => ({
      taxes: [],
      list: (filters) => {
        let result = get().taxes
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(t => t.name.toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q))
        }
        if (filters?.scope && filters.scope !== 'All') {
          result = result.filter(t => t.scope === filters.scope)
        }
        if (filters?.active !== undefined && filters.active !== 'All') {
          result = result.filter(t => t.active === filters.active)
        }
        return result
      },
      getById: (id) => get().taxes.find(t => t.id === id),
      create: (tax) => {
        const newTax: TaxRate = {
          ...tax,
          id: crypto.randomUUID(),
          active: true,
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        }
        set(state => ({ taxes: [...state.taxes, newTax] }))
        return newTax
      },
      update: (id, changes) => {
        set(state => ({
          taxes: state.taxes.map(t => t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString(), updatedBy: changes.updatedBy || 'Admin' } : t)
        }))
      },
      remove: (id, _actorRole) => {
        set(state => ({
          taxes: state.taxes.map(t => t.id === id ? { ...t, active: false, updatedAt: new Date().toISOString(), updatedBy: 'Admin' } : t)
        }))
      },
    }),
    { name: 'tax-store' }
  )
)


