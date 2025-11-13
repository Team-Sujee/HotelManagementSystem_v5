import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StandardRoomType } from '../types'

interface StandardRoomTypesFilters {
  search?: string
  sortBy?: 'name' | 'defaultCapacity'
  sortDir?: 'asc' | 'desc'
}

interface StandardRoomTypesState {
  standardRoomTypes: StandardRoomType[]
  list: (filters?: StandardRoomTypesFilters) => StandardRoomType[]
  getById: (id: string) => StandardRoomType | undefined
  create: (standardRoomType: Omit<StandardRoomType, 'id' | 'createdAt' | 'updatedAt'>) => StandardRoomType
  update: (id: string, changes: Partial<Omit<StandardRoomType, 'id' | 'createdAt'>>) => void
  remove: (id: string) => { success: boolean; error?: string }
  // Check if standard room type is in use
  isInUse: (id: string) => boolean
}

const sortStandardRoomTypes = (
  types: StandardRoomType[],
  sortBy?: StandardRoomTypesFilters['sortBy'],
  sortDir: StandardRoomTypesFilters['sortDir'] = 'asc'
) => {
  if (!sortBy) return types
  const dir = sortDir === 'asc' ? 1 : -1
  return [...types].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
    if (sortBy === 'defaultCapacity') return (a.defaultCapacity - b.defaultCapacity) * dir
    return 0
  })
}

// Initial mock data
const INITIAL_STANDARD_ROOM_TYPES: StandardRoomType[] = [
  {
    id: 'SRT-001',
    name: 'Single Room',
    description: 'Contains one single bed; meant for one person.',
    defaultCapacity: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SRT-002',
    name: 'Double Room',
    description: 'Has one double bed; suitable for two guests.',
    defaultCapacity: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SRT-003',
    name: 'Twin Room',
    description: 'Contains two single beds; ideal for two guests wanting separate beds.',
    defaultCapacity: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SRT-004',
    name: 'Triple Room',
    description: 'Has three single beds or one double + one single bed.',
    defaultCapacity: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SRT-005',
    name: 'Quad Room',
    description: 'Can accommodate four guests; may have two double beds or four singles.',
    defaultCapacity: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useStandardRoomTypesStore = create<StandardRoomTypesState>()(
  persist(
    (set, get) => ({
      standardRoomTypes: INITIAL_STANDARD_ROOM_TYPES,
      list: (filters) => {
        const { standardRoomTypes } = get()
        let result = [...standardRoomTypes]

        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q)
          )
        }

        result = sortStandardRoomTypes(result, filters?.sortBy, filters?.sortDir)
        return result
      },
      getById: (id) => get().standardRoomTypes.find((t) => t.id === id),
      create: (standardRoomType) => {
        const { standardRoomTypes } = get()
        
        // Validate unique name
        if (standardRoomTypes.some((t) => t.name === standardRoomType.name)) {
          throw new Error('Standard Room Type name must be unique')
        }

        // Validate positive capacity
        if (standardRoomType.defaultCapacity <= 0 || !Number.isInteger(standardRoomType.defaultCapacity)) {
          throw new Error('Default Capacity must be a positive integer')
        }

        const newType: StandardRoomType = {
          ...standardRoomType,
          id: `SRT-${String(standardRoomTypes.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          standardRoomTypes: [...state.standardRoomTypes, newType],
        }))

        return newType
      },
      update: (id, changes) => {
        const { standardRoomTypes } = get()
        
        // Validate unique name if name is being changed
        if (changes.name) {
          const existing = standardRoomTypes.find((t) => t.id !== id && t.name === changes.name)
          if (existing) {
            throw new Error('Standard Room Type name must be unique')
          }
        }

        // Validate positive capacity if capacity is being changed
        if (changes.defaultCapacity !== undefined) {
          if (changes.defaultCapacity <= 0 || !Number.isInteger(changes.defaultCapacity)) {
            throw new Error('Default Capacity must be a positive integer')
          }
        }

        set((state) => ({
          standardRoomTypes: state.standardRoomTypes.map((t) =>
            t.id === id
              ? { ...t, ...changes, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },
      remove: (id) => {
        if (get().isInUse(id)) {
          return {
            success: false,
            error: 'Cannot delete: This Standard Room Type is currently in use.',
          }
        }

        set((state) => ({
          standardRoomTypes: state.standardRoomTypes.filter((t) => t.id !== id),
        }))

        return { success: true }
      },
      isInUse: (id) => {
        // Check if used in RoomTypeConfig (via roomsStore or roomTypes state)
        // This will be checked in the component that uses this store
        // For now, we'll check in the component
        return false
      },
    }),
    {
      name: 'standard-room-types-store',
    }
  )
)

