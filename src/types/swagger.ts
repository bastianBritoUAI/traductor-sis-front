import type { OpenAPIV3 } from 'openapi-types'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

export interface SwaggerParameter {
  name: string
  location: OpenAPIV3.ParameterObject['in']
  description?: string
  required: boolean
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  example?: unknown
}

export interface SwaggerBody {
  required: boolean
  description?: string
  contentType: string
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  example?: unknown
}

export interface SwaggerResponse {
  status: string
  description: string
  contentType?: string
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  example?: unknown
}

export interface SwaggerEndpoint {
  id: string
  operationId?: string
  method: HttpMethod
  path: string
  summary: string
  description?: string
  tags: string[]
  deprecated: boolean
  parameters: SwaggerParameter[]
  requestBody?: SwaggerBody
  responses: SwaggerResponse[]
}

export interface EndpointExecutionResult {
  url: string
  method: string
  status: number
  statusText: string
  timestamp: string
  durationMs: number
  request: unknown
  headers: Record<string, string>
  data: unknown
}

export interface EndpointExecutionRecord {
  endpoint: Pick<SwaggerEndpoint, 'id' | 'method' | 'path' | 'summary'>
  timestamp: string
  durationMs: number
  request: unknown
  result?: EndpointExecutionResult
  error?: string
}
