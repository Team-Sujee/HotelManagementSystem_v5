import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Guest } from '../types'
import { MOCK_GUESTS } from '../constants'

interface GuestsFilters {
  search?: string
  status?: 'New' | 'Regular' | 'VIP' | 'All'
  country?: string
}

interface GuestsState {
  guests: Guest[]
  list: (filters?: GuestsFilters) => Guest[]
  getById: (id: string) => Guest | undefined
  findByEmail: (email: string) => Guest | undefined
  findByPhone: (phone: string) => Guest | undefined
  findByDocument: (documentNumber: string) => Guest | undefined
  create: (guest: Omit<Guest, 'id' | 'visitCount' | 'lifetimeSpending' | 'status'>) => Guest
  update: (id: string, changes: Partial<Guest>) => void
  remove: (id: string) => void
  incrementVisitCount: (id: string) => void
  updateLifetimeSpending: (id: string, amount: number) => void
}

const generateGuestId = () => `G${String(Date.now()).slice(-6)}`

export const useGuestsStore = create<GuestsState>()(
  persist(
    (set, get) => ({
      guests: MOCK_GUESTS.map(g => ({ ...g })),
      list: (filters) => {
        let result = get().guests

        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (g) =>
              g.fullName.toLowerCase().includes(q) ||
              g.email.toLowerCase().includes(q) ||
              g.phone.toLowerCase().includes(q) ||
              g.documentNumber.toLowerCase().includes(q)
          )
        }

        if (filters?.status && filters.status !== 'All') {
          result = result.filter((g) => g.status === filters.status)
        }

        if (filters?.country) {
          result = result.filter((g) => g.country.toLowerCase().includes(filters.country!.toLowerCase()))
        }

        return result
      },
      getById: (id) => get().guests.find((g) => g.id === id),
      findByEmail: (email) => get().guests.find((g) => g.email.toLowerCase() === email.toLowerCase()),
      findByPhone: (phone) => get().guests.find((g) => g.phone === phone),
      findByDocument: (documentNumber) => get().guests.find((g) => g.documentNumber === documentNumber),
      create: (guest) => {
        // Check for duplicates
        if (get().findByEmail(guest.email)) {
          throw new Error('Guest with this email already exists')
        }
        if (get().findByPhone(guest.phone)) {
          throw new Error('Guest with this phone number already exists')
        }
        if (get().findByDocument(guest.documentNumber)) {
          throw new Error('Guest with this document number already exists')
        }

        const newGuest: Guest = {
          ...guest,
          id: generateGuestId(),
          visitCount: 0,
          lifetimeSpending: 0,
          status: 'New',
        }

        set((state) => ({ guests: [...state.guests, newGuest] }))
        return newGuest
      },
      update: (id, changes) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === id ? { ...g, ...changes } : g
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          guests: state.guests.filter((g) => g.id !== id),
        }))
      },
      incrementVisitCount: (id) => {
        set((state) => ({
          guests: state.guests.map((g) => {
            if (g.id === id) {
              const newVisitCount = g.visitCount + 1
              let newStatus: Guest['status'] = g.status
              if (newVisitCount >= 5) {
                newStatus = 'VIP'
              } else if (newVisitCount >= 2) {
                newStatus = 'Regular'
              }
              return { ...g, visitCount: newVisitCount, status: newStatus }
            }
            return g
          }),
        }))
      },
      updateLifetimeSpending: (id, amount) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === id
              ? { ...g, lifetimeSpending: g.lifetimeSpending + amount }
              : g
          ),
        }))
      },
    }),
    {
      name: 'guests-store',
    }
  )
)

