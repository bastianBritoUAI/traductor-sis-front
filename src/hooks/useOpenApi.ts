import { useQuery } from '@tanstack/react-query'
import { fetchOpenApiDocument } from '../services/openapiService'
import { extractEndpoints } from '../utils/openapi'

export function useOpenApi() {
  return useQuery({
    queryKey: ['openapi-document'],
    queryFn: fetchOpenApiDocument,
    select: (document) => ({ document, endpoints: extractEndpoints(document) }),
  })
}
