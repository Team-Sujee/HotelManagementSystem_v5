import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MainChannel, SubChannel, MainChannelType } from '../types'

interface ChannelHierarchyState {
  mainChannels: MainChannel[]
  subChannels: SubChannel[]
  
  // Main Channel methods
  getMainChannel: (id: string) => MainChannel | undefined
  getMainChannelByName: (name: MainChannelType) => MainChannel | undefined
  createMainChannel: (channel: Omit<MainChannel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => MainChannel
  updateMainChannel: (id: string, changes: Partial<MainChannel>) => void
  removeMainChannel: (id: string) => void
  
  // Sub Channel methods
  getSubChannel: (id: string) => SubChannel | undefined
  getSubChannelsByMain: (mainChannelId: string) => SubChannel[]
  createSubChannel: (channel: Omit<SubChannel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => SubChannel
  updateSubChannel: (id: string, changes: Partial<SubChannel>) => void
  removeSubChannel: (id: string) => void
  
  // Combined calculation
  getEffectiveAdjustment: (mainChannelId: string, subChannelId?: string) => number
}

const defaultMainChannels: MainChannel[] = [
  {
    id: 'main-ota',
    name: 'OTA',
    adjustmentPercentage: 10,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
  {
    id: 'main-website',
    name: 'Website',
    adjustmentPercentage: 0,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
  {
    id: 'main-travel-agent',
    name: 'Travel Agent',
    adjustmentPercentage: 5,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
  {
    id: 'main-direct',
    name: 'Direct',
    adjustmentPercentage: 0,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
]

const defaultSubChannels: SubChannel[] = [
  {
    id: 'sub-booking-com',
    name: 'Booking.com',
    mainChannelId: 'main-ota',
    additionalAdjustmentPercentage: 5,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
  {
    id: 'sub-expedia',
    name: 'Expedia',
    mainChannelId: 'main-ota',
    additionalAdjustmentPercentage: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
  {
    id: 'sub-agoda',
    name: 'Agoda',
    mainChannelId: 'main-ota',
    additionalAdjustmentPercentage: 4,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
  },
]

export const useChannelHierarchyStore = create<ChannelHierarchyState>()(
  persist(
    (set, get) => ({
      mainChannels: defaultMainChannels,
      subChannels: defaultSubChannels,
      
      getMainChannel: (id) => get().mainChannels.find(c => c.id === id),
      getMainChannelByName: (name) => get().mainChannels.find(c => c.name === name),
      
      createMainChannel: (channel) => {
        const newChannel: MainChannel = {
          ...channel,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Admin',
        }
        set(state => ({
          mainChannels: [...state.mainChannels, newChannel],
        }))
        return newChannel
      },
      
      updateMainChannel: (id, changes) => {
        set(state => ({
          mainChannels: state.mainChannels.map(c =>
            c.id === id
              ? { ...c, ...changes, updatedAt: new Date().toISOString(), updatedBy: 'Admin' }
              : c
          ),
        }))
      },
      
      removeMainChannel: (id) => {
        // Also remove all sub-channels
        set(state => ({
          mainChannels: state.mainChannels.filter(c => c.id !== id),
          subChannels: state.subChannels.filter(sc => sc.mainChannelId !== id),
        }))
      },
      
      getSubChannel: (id) => get().subChannels.find(c => c.id === id),
      
      getSubChannelsByMain: (mainChannelId) =>
        get().subChannels.filter(sc => sc.mainChannelId === mainChannelId),
      
      createSubChannel: (channel) => {
        const newChannel: SubChannel = {
          ...channel,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Admin',
        }
        set(state => ({
          subChannels: [...state.subChannels, newChannel],
        }))
        return newChannel
      },
      
      updateSubChannel: (id, changes) => {
        set(state => ({
          subChannels: state.subChannels.map(c =>
            c.id === id
              ? { ...c, ...changes, updatedAt: new Date().toISOString(), updatedBy: 'Admin' }
              : c
          ),
        }))
      },
      
      removeSubChannel: (id) => {
        set(state => ({
          subChannels: state.subChannels.filter(c => c.id !== id),
        }))
      },
      
      getEffectiveAdjustment: (mainChannelId, subChannelId) => {
        const mainChannel = get().getMainChannel(mainChannelId)
        if (!mainChannel) return 0
        
        let totalAdjustment = mainChannel.adjustmentPercentage
        
        if (subChannelId) {
          const subChannel = get().getSubChannel(subChannelId)
          if (subChannel && subChannel.mainChannelId === mainChannelId) {
            totalAdjustment += subChannel.additionalAdjustmentPercentage
          }
        }
        
        return totalAdjustment
      },
    }),
    { name: 'channel-hierarchy-store' }
  )
)

