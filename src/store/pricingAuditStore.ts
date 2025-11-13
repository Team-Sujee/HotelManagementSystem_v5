import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PricingAuditLog } from '../types'

interface PricingAuditState {
  logs: PricingAuditLog[]
  
  addLog: (log: Omit<PricingAuditLog, 'id' | 'timestamp'>) => void
  getLogs: (filters?: {
    entityType?: PricingAuditLog['entityType']
    entityId?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => PricingAuditLog[]
}

export const usePricingAuditStore = create<PricingAuditState>()(
  persist(
    (set, get) => ({
      logs: [],
      
      addLog: (log) => {
        const newLog: PricingAuditLog = {
          ...log,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
        set(state => ({
          logs: [newLog, ...state.logs].slice(0, 1000), // Keep last 1000 logs
        }))
      },
      
      getLogs: (filters) => {
        let result = get().logs
        
        if (filters?.entityType) {
          result = result.filter(l => l.entityType === filters.entityType)
        }
        if (filters?.entityId) {
          result = result.filter(l => l.entityId === filters.entityId)
        }
        if (filters?.userId) {
          result = result.filter(l => l.userId === filters.userId)
        }
        if (filters?.startDate) {
          result = result.filter(l => l.timestamp >= filters.startDate!)
        }
        if (filters?.endDate) {
          result = result.filter(l => l.timestamp <= filters.endDate!)
        }
        
        return result
      },
    }),
    { name: 'pricing-audit-store' }
  )
)

