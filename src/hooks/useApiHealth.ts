import { useQuery } from '@tanstack/react-query'
import { checkApiAvailability } from '../services/connectivityService'
import { useApiSelectionStore } from '../store/apiSelectionStore'

export function useApiHealth() {
  const activeApiId = useApiSelectionStore((state) => state.activeApiId)
  return useQuery({
    queryKey: ['api-health', activeApiId],
    queryFn: checkApiAvailability,
    staleTime: 15_000,
    retry: false,
  })
}
