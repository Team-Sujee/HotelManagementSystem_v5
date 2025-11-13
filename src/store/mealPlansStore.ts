import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MealPlan, MealPlanCode } from '../types'
import { MOCK_MEAL_PLANS } from '../constants'

interface MealPlansFilters {
  search?: string
  active?: boolean
  codes?: MealPlanCode[]
}

interface MealPlansState {
  mealPlans: MealPlan[]
  list: (filters?: MealPlansFilters) => MealPlan[]
  getByCode: (code: MealPlanCode) => MealPlan | undefined
  create: (plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => MealPlan
  update: (id: string, changes: Partial<MealPlan>) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
}

const generateId = () => `MP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export const useMealPlansStore = create<MealPlansState>()(
  persist(
    (set, get) => ({
      mealPlans: MOCK_MEAL_PLANS.map(plan => ({ ...plan })),
      list: (filters) => {
        let plans = get().mealPlans
        if (filters?.search) {
          const query = filters.search.toLowerCase()
          plans = plans.filter((plan) =>
            plan.name.toLowerCase().includes(query) ||
            (plan.description?.toLowerCase() ?? '').includes(query) ||
            plan.code.toLowerCase().includes(query) ||
            (plan.notes?.toLowerCase() ?? '').includes(query)
          )
        }
        if (filters?.active !== undefined) {
          plans = plans.filter((plan) => plan.active === filters.active)
        }
        if (filters?.codes && filters.codes.length > 0) {
          plans = plans.filter((plan) => filters.codes?.includes(plan.code))
        }
        return plans
      },
      getByCode: (code) => get().mealPlans.find((plan) => plan.code === code),
      create: (plan) => {
        if (!plan.code) {
          throw new Error('Meal plan code is required')
        }
        const now = new Date().toISOString()
        const newPlan: MealPlan = {
          ...plan,
          id: plan.id ?? generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          mealPlans: [...state.mealPlans, newPlan],
        }))
        return newPlan
      },
      update: (id, changes) => {
        set((state) => ({
          mealPlans: state.mealPlans.map((plan) =>
            plan.id === id
              ? {
                  ...plan,
                  ...changes,
                  updatedAt: new Date().toISOString(),
                }
              : plan
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          mealPlans: state.mealPlans.filter((plan) => plan.id !== id),
        }))
      },
      toggleActive: (id) => {
        set((state) => ({
          mealPlans: state.mealPlans.map((plan) =>
            plan.id === id
              ? {
                  ...plan,
                  active: !plan.active,
                  updatedAt: new Date().toISOString(),
                }
              : plan
          ),
        }))
      },
    }),
    {
      name: 'meal-plans-store',
      partialize: (state) => ({ mealPlans: state.mealPlans }),
    }
  )
)


