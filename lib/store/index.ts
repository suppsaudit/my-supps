import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Supplement, ThemeMode } from '@/types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  selectedSupplements: Supplement[];
  addSupplement: (supplement: Supplement) => void;
  removeSupplement: (supplementId: string) => void;
  clearSupplements: () => void;
  
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  
  simulationResults: unknown | null;
  setSimulationResults: (results: unknown) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      selectedSupplements: [],
      addSupplement: (supplement) =>
        set((state) => ({
          selectedSupplements: [...state.selectedSupplements, supplement],
        })),
      removeSupplement: (supplementId) =>
        set((state) => ({
          selectedSupplements: state.selectedSupplements.filter(
            (s) => s.id !== supplementId
          ),
        })),
      clearSupplements: () => set({ selectedSupplements: [] }),
      
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      
      simulationResults: null,
      setSimulationResults: (results) => set({ simulationResults: results }),
    }),
    {
      name: 'my-supps-storage',
      partialize: (state) => ({
        theme: state.theme,
        selectedSupplements: state.selectedSupplements,
      }),
    }
  )
);