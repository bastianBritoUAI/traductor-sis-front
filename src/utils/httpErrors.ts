import axios from 'axios'

export function getHttpStatusMessage(status: number): string {
  if (status === 400) return 'Solicitud inválida. Revisa parámetros y request body.'
  if (status === 401) return 'El endpoint requiere credenciales que no se envían en modo público.'
  if (status === 403) return 'El servidor rechazó el acceso a este recurso.'
  if (status === 404) return 'El recurso solicitado no fue encontrado.'
  if (status >= 500) return 'La API presentó un error interno.'
  if (status >= 300) return `La API respondió con estado HTTP ${status}.`
  return 'Solicitud completada correctamente.'
}

/** Extrae el mensaje descriptivo que trae el cuerpo de una respuesta de error. */
export function extractApiErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined
  const obj = data as Record<string, unknown>
  // RFC 7807 ProblemDetails
  const detail = typeof obj.detail === 'string' ? obj.detail : undefined
  const title = typeof obj.title === 'string' ? obj.title : undefined
  if (detail) return title ? `${title}: ${detail}` : detail
  if (title) return title
  // patrones comunes de API
  if (typeof obj.message === 'string') return obj.message
  if (typeof obj.error === 'string') return obj.error
  if (typeof obj.errorMessage === 'string') return obj.errorMessage
  return undefined
}

export function getRequestErrorMessage(
  error: unknown,
  resource: 'Swagger' | 'API' | 'Endpoint' = 'Endpoint',
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : `Error inesperado al acceder a ${resource}.`
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return `Timeout: ${resource} no respondió dentro del tiempo esperado.`
  }

  if (error.response) return getHttpStatusMessage(error.response.status)

  if (error.code === 'ERR_NETWORK') {
    return `${resource} no está disponible. Revisa la red, la URL base y la configuración CORS.`
  }

  return error.message || `No fue posible conectar con ${resource}.`
}
