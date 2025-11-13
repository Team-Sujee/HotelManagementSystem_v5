import { create } from 'zustand'
import { User, UserRole } from '../types'

interface AuthState {
  user: User | null
  role: UserRole | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  login: (user) => set({ user, role: user.role }),
  logout: () => set({ user: null, role: null }),
}))
