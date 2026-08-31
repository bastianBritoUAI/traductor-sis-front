import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'
export type ExplorerView = 'details' | 'compare'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  selectedEndpointId?: string
  explorerView: ExplorerView
  comparisonEndpointIds: string[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void
  selectEndpoint: (id: string) => void
  closeEndpoint: () => void
  setExplorerView: (view: ExplorerView) => void
  toggleComparisonEndpoint: (id: string) => void
  resetExplorer: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: false,
      sidebarCollapsed: false,
      explorerView: 'details',
      comparisonEndpointIds: [],
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(theme)
        set({ theme })
      },
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      selectEndpoint: (selectedEndpointId) =>
        set({ selectedEndpointId, explorerView: 'details', sidebarOpen: false }),
      closeEndpoint: () => set({ selectedEndpointId: undefined, explorerView: 'details' }),
      setExplorerView: (explorerView) => set({ explorerView, sidebarOpen: false }),
      toggleComparisonEndpoint: (id) =>
        set((state) => ({
          comparisonEndpointIds: state.comparisonEndpointIds.includes(id)
            ? state.comparisonEndpointIds.filter((endpointId) => endpointId !== id)
            : [...state.comparisonEndpointIds, id],
        })),
      resetExplorer: () =>
        set({
          selectedEndpointId: undefined,
          comparisonEndpointIds: [],
          explorerView: 'details',
          sidebarOpen: false,
        }),
    }),
    {
      name: 'traductor-sis-ui',
      partialize: ({ theme, comparisonEndpointIds, sidebarCollapsed }) => ({
        theme,
        comparisonEndpointIds,
        sidebarCollapsed,
      }),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<UiState>
        return {
          theme: state.theme ?? 'dark',
          comparisonEndpointIds: state.comparisonEndpointIds ?? [],
          sidebarCollapsed: state.sidebarCollapsed ?? false,
        }
      },
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'dark'),
    },
  ),
)
