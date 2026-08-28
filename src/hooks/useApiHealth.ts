import { useQuery } from '@tanstack/react-query'
import { checkApiAvailability } from '../services/connectivityService'

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiAvailability,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  })
}
