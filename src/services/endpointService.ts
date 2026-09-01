import type { AxiosRequestConfig, AxiosResponse } from 'axios'
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

function isSuccessfulResponse(status: string) {
  return /^2(?:\d\d|xx)$/i.test(status)
}

function isBinaryContentType(contentType?: string) {
  if (!contentType) return false
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase()
  if (!mediaType || mediaType === '*/*') return false
  return !(
    mediaType.startsWith('text/') ||
    mediaType === 'application/json' ||
    mediaType.endsWith('+json') ||
    mediaType === 'application/xml' ||
    mediaType.endsWith('+xml') ||
    mediaType === 'application/x-www-form-urlencoded'
  )
}

function isBinaryResponse(endpoint: SwaggerEndpoint) {
  return endpoint.responses.some(
    (response) =>
      isSuccessfulResponse(response.status) &&
      (isBinaryContentType(response.contentType) ||
        (response.schema !== undefined &&
          'format' in response.schema &&
          response.schema.format === 'binary')),
  )
}

function getBinaryResponseContentType(endpoint: SwaggerEndpoint) {
  return endpoint.responses.find(
    (response) => isSuccessfulResponse(response.status) && isBinaryContentType(response.contentType),
  )?.contentType
}

function getResponseHeader(response: AxiosResponse, name: string) {
  const headers = response.headers
  const value = typeof headers.get === 'function' ? headers.get(name) : headers[name]
  return Array.isArray(value) ? value.join(', ') : value
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').trim() || 'descarga'
}

function getDownloadFilename(contentDisposition?: string) {
  if (!contentDisposition) return undefined
  const encodedMatch = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(contentDisposition)
  const plainMatch = /filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(contentDisposition)
  const filename = encodedMatch?.[1] ?? plainMatch?.[1] ?? plainMatch?.[2]
  if (!filename) return undefined

  try {
    return sanitizeFilename(decodeURIComponent(filename.replace(/^"|"$/g, '')))
  } catch {
    return sanitizeFilename(filename.replace(/^"|"$/g, ''))
  }
}

function fallbackFilename(contentType: string) {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'text/csv': 'csv',
  }
  return `descarga.${extensions[contentType.toLowerCase()] ?? 'bin'}`
}

async function readBlobResponse(blob: Blob, contentType: string): Promise<unknown> {
  const text = await blob.text()
  if (contentType.toLowerCase().includes('json')) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      // Una respuesta marcada como JSON puede contener un cuerpo incompleto o no vÃ¡lido.
    }
  }
  return text
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

  const expectsBinary = isBinaryResponse(endpoint)
  if (expectsBinary) {
    config.responseType = 'blob'
    const binaryContentType = getBinaryResponseContentType(endpoint)
    if (binaryContentType && !headers.Accept && !headers.accept) headers.Accept = binaryContentType
  }

  if (body !== undefined && endpoint.requestBody?.contentType) {
    config.headers = { ...headers, 'Content-Type': endpoint.requestBody.contentType }
  }

  const transport = getApiTransport()
  const url = transport.buildUrl(config)
  const timestamp = new Date().toISOString()
  const startedAt = performance.now()
  const response = await transport.request(config)
  const contentType =
    getResponseHeader(response, 'content-type') ??
    (response.data instanceof Blob ? response.data.type : '') ??
    'application/octet-stream'
  const download =
    response.status >= 200 && response.status < 300 && response.data instanceof Blob
      ? {
          blob: response.data,
          filename:
            getDownloadFilename(getResponseHeader(response, 'content-disposition')) ??
            fallbackFilename(contentType),
          contentType,
        }
      : undefined
  const responseData = download
    ? {
        message: 'Archivo binario listo para descargar.',
        filename: download.filename,
        contentType: download.contentType,
        size: download.blob.size,
      }
    : response.data instanceof Blob
      ? await readBlobResponse(response.data, contentType)
      : response.data

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
    data: redactSensitiveData(responseData),
    download,
  }
}
