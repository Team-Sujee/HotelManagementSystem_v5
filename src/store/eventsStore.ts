import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HotelEvent, EventType, EventFinancials } from '../types'

interface EventFilters {
  search?: string
  type?: EventType | 'All'
  status?: HotelEvent['status'] | 'All'
  dateFrom?: string
  dateTo?: string
}

interface EventsState {
  events: HotelEvent[]
  list: (filters?: EventFilters) => HotelEvent[]
  create: (event: Omit<HotelEvent, 'id' | 'createdAt'>) => HotelEvent
  update: (id: string, changes: Partial<HotelEvent>) => void
  remove: (id: string) => void
  setStatus: (id: string, status: HotelEvent['status']) => void
  updateFinancials: (id: string, changes: Partial<EventFinancials>) => void
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: [],
      list: (filters) => {
        let result = get().events
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(e => e.name.toLowerCase().includes(q) || (e.clientName || '').toLowerCase().includes(q))
        }
        if (filters?.type && filters.type !== 'All') {
          result = result.filter(e => e.type === filters.type)
        }
        if (filters?.status && filters.status !== 'All') {
          result = result.filter(e => e.status === filters.status)
        }
        if (filters?.dateFrom) {
          result = result.filter(e => e.date >= filters.dateFrom!)
        }
        if (filters?.dateTo) {
          result = result.filter(e => e.date <= filters.dateTo!)
        }
        return result
      },
      create: (event) => {
        const newEvent: HotelEvent = {
          ...event,
          id: crypto.randomUUID(),
          status: event.status ?? 'Scheduled',
          financials: event.financials ?? undefined,
          createdAt: new Date().toISOString(),
        }
        set(state => ({ events: [...state.events, newEvent] }))
        return newEvent
      },
      update: (id, changes) => {
        set(state => ({
          events: state.events.map(e => e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e)
        }))
      },
      remove: (id) => {
        set(state => ({ events: state.events.filter(e => e.id !== id) }))
      },
      setStatus: (id, status) => {
        set(state => ({
          events: state.events.map(e => e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e)
        }))
      },
      updateFinancials: (id, changes) => {
        set(state => ({
          events: state.events.map(e =>
            e.id === id
              ? {
                  ...e,
                  financials: {
                    ...(e.financials ?? {
                      baseAmount: 0,
                      addonsAmount: 0,
                      discountAmount: 0,
                      taxRate: 0,
                      taxAmount: 0,
                      totalAmount: 0,
                      currency: 'USD',
                      paymentStatus: 'Pending',
                    }),
                    ...changes,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        }))
      },
    }),
    { name: 'events-store' }
  )
)


