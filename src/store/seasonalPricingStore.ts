import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Season, PriceAdjustmentType, SeasonStatus } from '../types'

interface SeasonalPricingState {
  seasons: Season[]
  
  getSeason: (id: string) => Season | undefined
  getActiveSeasons: () => Season[]
  getSeasonForDate: (date: string) => Season | undefined
  createSeason: (season: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>) => Season
  updateSeason: (id: string, changes: Partial<Season>) => void
  removeSeason: (id: string) => void
  
  // Get adjustment for specific room/meal type
  getSeasonalAdjustment: (date: string, roomType?: string, mealPlan?: string, stayType?: string) => number
}

export const useSeasonalPricingStore = create<SeasonalPricingState>()(
  persist(
    (set, get) => ({
      seasons: [],
      
      getSeason: (id) => get().seasons.find(s => s.id === id),
      
      getActiveSeasons: () => get().seasons.filter(s => s.status === SeasonStatus.Active),
      
      getSeasonForDate: (date) => {
        const dateObj = new Date(date)
        return get().seasons.find(s => {
          if (s.status !== SeasonStatus.Active) return false
          const start = new Date(s.startDate)
          const end = new Date(s.endDate)
          return dateObj >= start && dateObj <= end
        })
      },
      
      createSeason: (season) => {
        const newSeason: Season = {
          ...season,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set(state => ({
          seasons: [...state.seasons, newSeason],
        }))
        return newSeason
      },
      
      updateSeason: (id, changes) => {
        set(state => ({
          seasons: state.seasons.map(s =>
            s.id === id
              ? { ...s, ...changes, updatedAt: new Date().toISOString() }
              : s
          ),
        }))
      },
      
      removeSeason: (id) => {
        set(state => ({
          seasons: state.seasons.filter(s => s.id !== id),
        }))
      },
      
      getSeasonalAdjustment: (date, roomType, mealPlan, stayType) => {
        const season = get().getSeasonForDate(date)
        if (!season) return 0
        
        let adjustment = season.adjustmentValue
        
        // Apply room type specific adjustment
        if (roomType && season.roomTypeAdjustments?.[roomType]) {
          adjustment += season.roomTypeAdjustments[roomType]
        }
        
        // Apply meal plan specific adjustment
        if (mealPlan && season.mealPlanAdjustments?.[mealPlan]) {
          adjustment += season.mealPlanAdjustments[mealPlan]
        }
        
        // Apply stay type specific adjustment (takes precedence)
        if (stayType && season.stayTypeAdjustments?.[stayType]) {
          adjustment += season.stayTypeAdjustments[stayType]
        }
        
        return adjustment
      },
    }),
    { name: 'seasonal-pricing-store' }
  )
)

