import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CurrencyRate, UserRole } from '../types'

interface CurrencyFilters {
  search?: string
  status?: 'Active' | 'Inactive' | 'All'
}

interface CurrencyState {
  baseCurrencyCode: string
  currencies: CurrencyRate[]
  preferredCurrency?: string
  list: (filters?: CurrencyFilters) => CurrencyRate[]
  getByCode: (code: string) => CurrencyRate | undefined
  create: (currency: Omit<CurrencyRate, 'id' | 'createdAt' | 'createdBy' | 'lastUpdated'>) => CurrencyRate
  update: (code: string, changes: Partial<CurrencyRate>) => void
  remove: (code: string, actorRole?: UserRole) => void
  setPreferred: (code: string) => void
  convertFromBase: (amount: number, code: string) => number
  refreshRates: () => Promise<void> // stub for external API
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      baseCurrencyCode: 'USD',
      currencies: [
        { id: 'USD', name: 'US Dollar', code: 'USD', symbol: '$', rateToBase: 1, status: 'Active', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString(), createdBy: 'System' },
        { id: 'EUR', name: 'Euro', code: 'EUR', symbol: '€', rateToBase: 0.92, status: 'Active', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString(), createdBy: 'System' },
        { id: 'LKR', name: 'Sri Lankan Rupee', code: 'LKR', symbol: 'LKR', rateToBase: 300, status: 'Active', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString(), createdBy: 'System' },
      ],
      preferredCurrency: 'USD',
      list: (filters) => {
        let result = get().currencies
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        }
        if (filters?.status && filters.status !== 'All') {
          result = result.filter(c => c.status === filters.status)
        }
        return result
      },
      getByCode: (code) => get().currencies.find(c => c.code === code),
      create: (currency) => {
        const newCurrency: CurrencyRate = {
          ...currency,
          id: currency.code,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        }
        set(state => ({ currencies: [...state.currencies, newCurrency] }))
        return newCurrency
      },
      update: (code, changes) => {
        set(state => ({
          currencies: state.currencies.map(c => c.code === code ? { ...c, ...changes, updatedAt: new Date().toISOString(), updatedBy: changes.updatedBy || 'Admin', lastUpdated: new Date().toISOString() } : c)
        }))
      },
      remove: (code, _actorRole) => {
        set(state => ({
          currencies: state.currencies.map(c => c.code === code ? { ...c, status: 'Inactive', updatedAt: new Date().toISOString(), updatedBy: 'Admin' } : c)
        }))
      },
      setPreferred: (code) => {
        set({ preferredCurrency: code })
      },
      convertFromBase: (amount, code) => {
        const currency = get().currencies.find(c => c.code === code)
        if (!currency) return amount
        const converted = amount * currency.rateToBase
        return Math.round((converted + Number.EPSILON) * 100) / 100
      },
      refreshRates: async () => {
        // Stub: In real implementation, call external API and update rates
        await new Promise(r => setTimeout(r, 300))
        // No changes applied in stub
      },
    }),
    { name: 'currency-store' }
  )
)


