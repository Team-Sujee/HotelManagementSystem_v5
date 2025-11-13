import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MealPlanCode, Room, RoomActivityLog, RoomStatus, UserRole } from '../types'
import { MOCK_ROOMS } from '../constants'

interface RoomsFilters {
  search?: string
  status?: RoomStatus | 'All'
  type?: string | 'All'
  area?: string | 'All'
  capacityGte?: number
  sortBy?: 'price' | 'type' | 'status' | 'area' | 'viewType' | 'mealPlan'
  sortDir?: 'asc' | 'desc'
  viewTypeId?: string | 'All'
  mealPlanCode?: MealPlanCode | 'All'
}

interface RoomsState {
  rooms: Room[]
  activityLogs: RoomActivityLog[]
  getById: (id: string) => Room | undefined
  list: (filters?: RoomsFilters) => Room[]
  create: (room: Omit<Room, 'id'>) => Room
  update: (id: string, changes: Partial<Room>) => void
  remove: (id: string, reason?: string, actorRole?: UserRole) => void
  setStatus: (id: string, status: RoomStatus) => void
  // lifecycle helpers
  markReserved: (id: string) => void
  markOccupied: (id: string) => void
  markDirty: (id: string) => void
  markAvailable: (id: string) => void
  markMaintenance: (id: string) => void
}

const sortRooms = (rooms: Room[], sortBy?: RoomsFilters['sortBy'], sortDir: RoomsFilters['sortDir'] = 'asc') => {
  if (!sortBy) return rooms
  const dir = sortDir === 'asc' ? 1 : -1
  return [...rooms].sort((a, b) => {
    if (sortBy === 'price') return (a.price - b.price) * dir
    if (sortBy === 'type') return a.type.localeCompare(b.type) * dir
    if (sortBy === 'status') return a.status.localeCompare(b.status) * dir
    if (sortBy === 'area') return (a.area || '').localeCompare(b.area || '') * dir
    if (sortBy === 'viewType') return (a.viewTypeName || '').localeCompare(b.viewTypeName || '') * dir
    if (sortBy === 'mealPlan') return (a.mealPlanCode || '').localeCompare(b.mealPlanCode || '') * dir
    return 0
  })
}

export const useRoomsStore = create<RoomsState>()(
  persist(
    (set, get) => ({
      rooms: (MOCK_ROOMS as unknown as Room[]).map(r => ({
        ...r,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      })),
      activityLogs: [],
      getById: (id) => get().rooms.find(r => r.id === id),
      list: (filters) => {
        const { rooms } = get()
        let result = rooms.filter(r => r.active !== false)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(r =>
            r.number.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q) ||
            r.area.toLowerCase().includes(q) ||
            (r.viewTypeName || '').toLowerCase().includes(q)
          )
        }
        if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
          const min = (filters as any).minPrice ?? Number.NEGATIVE_INFINITY
          const max = (filters as any).maxPrice ?? Number.POSITIVE_INFINITY
          result = result.filter(r => r.price >= min && r.price <= max)
        }
        if (filters?.status && filters.status !== 'All') {
          result = result.filter(r => r.status === filters.status)
        }
        if (filters?.type && filters.type !== 'All') {
          result = result.filter(r => r.type === filters.type)
        }
        if (filters?.area && filters.area !== 'All') {
          result = result.filter(r => r.area === filters.area)
        }
        if (filters?.viewTypeId && filters.viewTypeId !== 'All') {
          result = result.filter(r => r.viewTypeId === filters.viewTypeId)
        }
        if (filters?.mealPlanCode && filters.mealPlanCode !== 'All') {
          result = result.filter(r => r.mealPlanCode === filters.mealPlanCode)
        }
        if (filters?.capacityGte) {
          result = result.filter(r => r.capacity >= (filters.capacityGte as number))
        }
        result = sortRooms(result, filters?.sortBy, filters?.sortDir)
        return result
      },
      create: (room) => {
        const newRoom: Room = { ...room, id: crypto.randomUUID(), active: true, createdAt: new Date().toISOString(), createdBy: 'Admin' }
        set(state => ({ rooms: [...state.rooms, newRoom], activityLogs: [...state.activityLogs, {
          id: crypto.randomUUID(),
          roomId: newRoom.id,
          action: 'Create',
          actorRole: UserRole.Admin,
          createdAt: new Date().toISOString(),
        }] }))
        return newRoom
      },
      update: (id, changes) => {
        set(state => {
          const before = state.rooms.find(r => r.id === id)
          const updated = state.rooms.map(r => (r.id === id ? { ...r, ...changes, updatedAt: new Date().toISOString(), updatedBy: changes.updatedBy || 'Admin' } : r))
          const logs: RoomActivityLog[] = before ? [{
            id: crypto.randomUUID(),
            roomId: id,
            action: 'Update',
            from: JSON.stringify({ type: before.type, price: before.price, capacity: before.capacity, status: before.status }),
            to: JSON.stringify({ type: (changes.type ?? before.type), price: (changes.price ?? before.price), capacity: (changes.capacity ?? before.capacity), status: (changes.status ?? before.status) }),
            actorRole: UserRole.Admin,
            createdAt: new Date().toISOString(),
          }] : []
          return { rooms: updated, activityLogs: [...state.activityLogs, ...logs] }
        })
      },
      remove: (id, reason, actorRole = UserRole.Admin) => {
        set(state => {
          const updated = state.rooms.map(r => (r.id === id ? { ...r, active: false, updatedAt: new Date().toISOString(), updatedBy: 'Admin' } : r))
          const log: RoomActivityLog = {
            id: crypto.randomUUID(),
            roomId: id,
            action: 'Delete',
            notes: reason || 'Removed',
            actorRole,
            createdAt: new Date().toISOString(),
          }
          return { rooms: updated, activityLogs: [...state.activityLogs, log] }
        })
      },
      setStatus: (id, status) => {
        set(state => {
          const before = state.rooms.find(r => r.id === id)
          const updated = state.rooms.map(r => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString(), updatedBy: 'System' } : r))
          const logs: RoomActivityLog[] = before ? [{
            id: crypto.randomUUID(),
            roomId: id,
            action: 'StatusUpdate',
            from: before.status,
            to: status,
            actorRole: UserRole.Receptionist,
            createdAt: new Date().toISOString(),
          }] : []
          return { rooms: updated, activityLogs: [...state.activityLogs, ...logs] }
        })
      },
      markReserved: (id) => get().setStatus(id, RoomStatus.Reserved),
      markOccupied: (id) => get().setStatus(id, RoomStatus.Occupied),
      markDirty: (id) => get().setStatus(id, RoomStatus.Dirty),
      markAvailable: (id) => get().setStatus(id, RoomStatus.Available),
      markMaintenance: (id) => get().setStatus(id, RoomStatus.UnderMaintenance),
    }),
    {
      name: 'rooms-store',
      partialize: (state) => ({ rooms: state.rooms }),
    }
  )
)


