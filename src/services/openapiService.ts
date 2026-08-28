import type { OpenAPIV3 } from 'openapi-types'
import { getOpenApiClient } from './api/axios.config'

export async function fetchOpenApiDocument(): Promise<OpenAPIV3.Document> {
  const response = await getOpenApiClient().get<OpenAPIV3.Document>('', {
    timeout: 30_000,
    headers: { Accept: 'application/json' },
  })

  if (!response.data.openapi || !response.data.paths) {
    throw new Error('El documento recibido no es una definición OpenAPI válida.')
  }

  return response.data
}
