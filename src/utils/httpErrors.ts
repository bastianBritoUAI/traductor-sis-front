import axios from 'axios'

export function getHttpStatusMessage(status: number): string {
  if (status === 400) return 'Solicitud inválida. Revisa parámetros y request body.'
  if (status === 401) return 'El endpoint requiere credenciales que no se envían en modo público.'
  if (status === 403) return 'El servidor rechazó el acceso a este recurso.'
  if (status === 404) return 'El endpoint solicitado no está disponible.'
  if (status >= 500) return 'La API presentó un error interno.'
  if (status >= 300) return `La API respondió con estado HTTP ${status}.`
  return 'Solicitud completada correctamente.'
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
