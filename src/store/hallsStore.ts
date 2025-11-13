import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Hall } from '../types'

interface HallsState {
  halls: Hall[]
  list: () => Hall[]
  create: (hall: Omit<Hall, 'id' | 'createdAt'>) => Hall
  update: (id: string, changes: Partial<Hall>) => void
  remove: (id: string) => void
  setStatus: (id: string, status: Hall['status']) => void
  updateMetrics: (id: string, metrics: Pick<Hall, 'occupancyRate' | 'maintenanceCount' | 'revenueGenerated'>) => void
}

export const useHallsStore = create<HallsState>()(
  persist(
    (set, get) => ({
      halls: [],
      list: () => get().halls,
      create: (hall) => {
        const newHall: Hall = {
          ...hall,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        set(state => ({ halls: [...state.halls, newHall] }))
        return newHall
      },
      update: (id, changes) => {
        set(state => ({
          halls: state.halls.map(h => h.id === id ? { ...h, ...changes, updatedAt: new Date().toISOString() } : h)
        }))
      },
      remove: (id) => {
        set(state => ({ halls: state.halls.filter(h => h.id !== id) }))
      },
      setStatus: (id, status) => {
        set(state => ({
          halls: state.halls.map(h => h.id === id ? { ...h, status, updatedAt: new Date().toISOString() } : h)
        }))
      },
      updateMetrics: (id, metrics) => {
        set(state => ({
          halls: state.halls.map(h =>
            h.id === id
              ? {
                  ...h,
                  ...metrics,
                  updatedAt: new Date().toISOString(),
                }
              : h
          ),
        }))
      },
    }),
    { name: 'halls-store' }
  )
)


