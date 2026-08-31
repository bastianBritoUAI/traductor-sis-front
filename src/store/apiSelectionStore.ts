import { create } from 'zustand'
import { type ApiConfiguration, setActiveApi } from '../config/env'
import { clearToken } from '../services/auth/token.service'
import { useUiStore } from './uiStore'

interface ApiSelectionState {
  activeApiId?: ApiConfiguration['id']
  initialize: (id: ApiConfiguration['id']) => void
  selectApi: (id: ApiConfiguration['id']) => void
}

export const useApiSelectionStore = create<ApiSelectionState>((set) => ({
  activeApiId: undefined,
  initialize: (activeApiId) => set({ activeApiId }),
  selectApi: (activeApiId) => {
    setActiveApi(activeApiId)
    clearToken()
    useUiStore.getState().resetExplorer()
    set({ activeApiId })
  },
}))
