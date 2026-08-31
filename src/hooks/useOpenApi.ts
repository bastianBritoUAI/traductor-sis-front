import { useQuery } from '@tanstack/react-query'
import { fetchOpenApiDocument } from '../services/openapiService'
import { extractEndpoints } from '../utils/openapi'
import { useApiSelectionStore } from '../store/apiSelectionStore'

export function useOpenApi() {
  const activeApiId = useApiSelectionStore((state) => state.activeApiId)
  return useQuery({
    queryKey: ['openapi-document', activeApiId],
    queryFn: fetchOpenApiDocument,
    select: (document) => ({ document, endpoints: extractEndpoints(document) }),
  })
}
