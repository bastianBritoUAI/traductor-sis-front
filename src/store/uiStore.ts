import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'
export type ExplorerView = 'details' | 'compare'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  selectedEndpointId?: string
  explorerView: ExplorerView
  comparisonEndpointIds: string[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  selectEndpoint: (id: string) => void
  setExplorerView: (view: ExplorerView) => void
  toggleComparisonEndpoint: (id: string) => void
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
      selectEndpoint: (selectedEndpointId) =>
        set({ selectedEndpointId, explorerView: 'details', sidebarOpen: false }),
      setExplorerView: (explorerView) => set({ explorerView, sidebarOpen: false }),
      toggleComparisonEndpoint: (id) =>
        set((state) => ({
          comparisonEndpointIds: state.comparisonEndpointIds.includes(id)
            ? state.comparisonEndpointIds.filter((endpointId) => endpointId !== id)
            : [...state.comparisonEndpointIds, id],
        })),
    }),
    {
      name: 'traductor-sis-ui',
      partialize: ({ theme, selectedEndpointId, explorerView, comparisonEndpointIds }) => ({
        theme,
        selectedEndpointId,
        explorerView,
        comparisonEndpointIds,
      }),
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'dark'),
    },
  ),
)
