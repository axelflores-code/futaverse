import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ReaderSettings {
  theme: Theme;
  maxWidth: 600 | 800 | 1100;
  gap: 0 | 8 | 16;
  brightness: number; // 50–110
}

interface ReaderState {
  // Estado de lectura (no persistido)
  currentPage: number;
  totalPages: number;
  showSettings: boolean;

  // Ajustes del lector (persistidos)
  settings: ReaderSettings;

  // Acciones
  setPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setShowSettings: (show: boolean) => void;
  updateSettings: (patch: Partial<ReaderSettings>) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'dark',
  maxWidth: 800,
  gap: 0,
  brightness: 100,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      currentPage: 0,
      totalPages: 0,
      showSettings: false,

      settings: DEFAULT_SETTINGS,

      setPage: (page) => set({ currentPage: page }),
      setTotalPages: (total) => set({ totalPages: total }),
      setShowSettings: (show) => set({ showSettings: show }),
      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),
    }),
    {
      name: 'futaverse-reader-v2',
      // Solo persistir los ajustes del usuario, no el estado de lectura
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);