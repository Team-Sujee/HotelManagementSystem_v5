import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChannelPricingRule } from '../types'

interface ChannelPricingFilters {
  roomType?: string | 'All'
  channel?: ChannelPricingRule['channel'] | 'All'
  active?: boolean | 'All'
}

interface ChannelPricingState {
  rules: ChannelPricingRule[]
  list: (filters?: ChannelPricingFilters) => ChannelPricingRule[]
  create: (rule: Omit<ChannelPricingRule, 'id' | 'createdAt' | 'createdBy' | 'active'>) => ChannelPricingRule
  update: (id: string, changes: Partial<ChannelPricingRule>) => void
  remove: (id: string) => void
}

export const useChannelPricingStore = create<ChannelPricingState>()(
  persist(
    (set, get) => ({
      rules: [],
      list: (filters) => {
        let result = get().rules
        if (filters?.roomType && filters.roomType !== 'All') result = result.filter(r => r.roomType === filters.roomType)
        if (filters?.channel && filters.channel !== 'All') result = result.filter(r => r.channel === filters.channel)
        if (filters?.active !== undefined && filters.active !== 'All') result = result.filter(r => r.active === filters.active)
        return result
      },
      create: (rule) => {
        const newRule: ChannelPricingRule = {
          ...rule,
          id: crypto.randomUUID(),
          active: true,
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        }
        // enforce one active rule per channel+roomType per date range
        set(state => ({
          rules: [...state.rules.filter(r => !(r.active && r.roomType === newRule.roomType && r.channel === newRule.channel && overlaps(r.validFrom, r.validTo, newRule.validFrom, newRule.validTo))), newRule]
        }))
        return newRule
      },
      update: (id, changes) => {
        set(state => ({
          rules: state.rules.map(r => r.id === id ? { ...r, ...changes, updatedAt: new Date().toISOString(), updatedBy: changes.updatedBy || 'Admin' } : r)
        }))
      },
      remove: (id) => {
        set(state => ({ rules: state.rules.filter(r => r.id !== id) }))
      },
    }),
    { name: 'channel-pricing-store' }
  )
)

function overlaps(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string) {
  const aS = aStart ? new Date(aStart).getTime() : -Infinity
  const aE = aEnd ? new Date(aEnd).getTime() : Infinity
  const bS = bStart ? new Date(bStart).getTime() : -Infinity
  const bE = bEnd ? new Date(bEnd).getTime() : Infinity
  return aS <= bE && bS <= aE
}


