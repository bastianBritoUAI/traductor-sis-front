import type { AxiosRequestConfig } from 'axios'
import { getApiTransport } from '../api/transport'
import type { EndpointExecutionResult, SwaggerEndpoint } from '../types/swagger'
import { redactSensitiveData } from '../utils/redaction'

export type ParameterValues = Record<string, string>

export interface ExecuteEndpointInput {
  endpoint: SwaggerEndpoint
  parameters: ParameterValues
  body?: unknown
}

function parameterKey(location: string, name: string) {
  return `${location}:${name}`
}

export async function executeEndpoint({
  endpoint,
  parameters,
  body,
}: ExecuteEndpointInput): Promise<EndpointExecutionResult> {
  let resolvedPath = endpoint.path
  const query: Record<string, string> = {}
  const headers: Record<string, string> = {}

  endpoint.parameters.forEach((parameter) => {
    const value = parameters[parameterKey(parameter.location, parameter.name)]
    if (value === undefined || value === '') return

    if (parameter.location === 'path') {
      resolvedPath = resolvedPath.replace(`{${parameter.name}}`, encodeURIComponent(value))
    } else if (parameter.location === 'query') {
      query[parameter.name] = value
    } else if (parameter.location === 'header') {
      headers[parameter.name] = value
    }
  })

  const missingPathValue = resolvedPath.match(/\{([^}]+)\}/)?.[1]
  if (missingPathValue)
    throw new Error(`Falta el parámetro de ruta obligatorio: ${missingPathValue}`)

  const config: AxiosRequestConfig = {
    url: resolvedPath,
    method: endpoint.method,
    params: query,
    headers,
    data: body,
    validateStatus: () => true,
  }

  if (body !== undefined && endpoint.requestBody?.contentType) {
    config.headers = { ...headers, 'Content-Type': endpoint.requestBody.contentType }
  }

  const transport = getApiTransport()
  const url = transport.buildUrl(config)
  const timestamp = new Date().toISOString()
  const startedAt = performance.now()
  const response = await transport.request(config)

  return {
    url,
    method: endpoint.method.toUpperCase(),
    status: response.status,
    statusText: response.statusText,
    timestamp,
    durationMs: Math.round(performance.now() - startedAt),
    request: redactSensitiveData({
      parameters: Object.fromEntries(
        Object.entries(parameters).filter(([, value]) => value !== ''),
      ),
      body,
    }),
    headers: redactSensitiveData(
      Object.fromEntries(
        Object.entries(response.headers).map(([name, value]) => [name, String(value)]),
      ),
    ) as Record<string, string>,
    data: redactSensitiveData(response.data),
  }
}
