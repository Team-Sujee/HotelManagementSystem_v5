import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EventPackage, EventType } from '../types'

const DEFAULT_EVENT_PACKAGES: EventPackage[] = [
  {
    id: 'PKG-001',
    name: 'Signature Wedding Bliss',
    description: 'Full wedding package with premium décor, lighting, and curated menu.',
    includedServices: ['Hall decoration', 'Premium lighting', 'Full-course catering', 'Live music coordination'],
    basePrice: 8500,
    taxRate: 12,
    duration: 'Full-Day',
    recommendedFor: [EventType.Wedding, EventType.Party],
    addons: [
      { name: 'Fireworks display', price: 1200 },
      { name: 'Photo booth', price: 450 },
    ],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PKG-002',
    name: 'Corporate Summit Pro',
    description: 'Ideal for conferences and summits with AV support and working lunch.',
    includedServices: ['Hall setup', 'Audio/video equipment', 'Working lunch buffet', 'Tea/coffee stations'],
    basePrice: 5200,
    taxRate: 10,
    duration: 'Full-Day',
    recommendedFor: [EventType.Conference, EventType.Meeting],
    addons: [
      { name: 'Simultaneous interpretation', price: 900 },
      { name: 'Additional breakout room', price: 600 },
    ],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PKG-003',
    name: 'Celebration Essentials',
    description: 'Affordable package for birthdays and social gatherings.',
    includedServices: ['Basic decoration', 'Buffet dinner', 'DJ coordination'],
    basePrice: 3100,
    taxRate: 8,
    duration: 'Half-Day',
    recommendedFor: [EventType.Party, EventType.Other],
    addons: [
      { name: 'Live band', price: 750 },
      { name: 'Photo & video coverage', price: 680 },
    ],
    active: true,
    createdAt: new Date().toISOString(),
  },
]

interface EventPackagesState {
  packages: EventPackage[]
  list: (activeOnly?: boolean) => EventPackage[]
  getById: (id: string) => EventPackage | undefined
  create: (pkg: Omit<EventPackage, 'id' | 'createdAt'>) => EventPackage
  update: (id: string, changes: Partial<EventPackage>) => void
  remove: (id: string) => void
  suggest: (eventType: EventType) => EventPackage[]
}

export const useEventPackagesStore = create<EventPackagesState>()(
  persist(
    (set, get) => ({
      packages: DEFAULT_EVENT_PACKAGES,
      list: (activeOnly) => {
        const data = get().packages
        if (!activeOnly) return data
        return data.filter(pkg => pkg.active)
      },
      getById: (id) => get().packages.find(pkg => pkg.id === id),
      create: (pkg) => {
        const newPackage: EventPackage = {
          ...pkg,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        set(state => ({ packages: [...state.packages, newPackage] }))
        return newPackage
      },
      update: (id, changes) => {
        set(state => ({
          packages: state.packages.map(pkg =>
            pkg.id === id ? { ...pkg, ...changes, updatedAt: new Date().toISOString() } : pkg
          ),
        }))
      },
      remove: (id) => {
        set(state => ({ packages: state.packages.filter(pkg => pkg.id !== id) }))
      },
      suggest: (eventType) => {
        const data = get().packages.filter(pkg => pkg.active)
        return data
          .filter(pkg => pkg.recommendedFor.includes(eventType))
          .concat(data.filter(pkg => !pkg.recommendedFor.includes(eventType)))
          .slice(0, 3)
      },
    }),
    {
      name: 'event-packages-store',
      partialize: (state) => ({ packages: state.packages }),
    }
  )
)


