import axios from 'axios'
import {
  DEFAULT_TOKEN_LIFETIME_SECONDS,
  DEFAULT_TOKEN_TYPE,
  TOKEN_ENDPOINT,
  TOKEN_REQUEST_TIMEOUT_MS,
} from './token.constants'
import { clearStoredToken, getStoredToken, isStoredTokenValid, storeToken } from './token.storage'
import { TokenServiceError, type StoredToken, type TokenApiResponse } from './token.types'

let pendingTokenRequest: Promise<string> | undefined

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined
}

function readTokenResponse(value: unknown): TokenApiResponse {
  const outer = asRecord(value)
  const nested = asRecord(outer?.data)
  return nested ?? outer ?? {}
}

function readJwtExpiration(accessToken: string): number | undefined {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return undefined
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const parsed = JSON.parse(globalThis.atob(normalized)) as { exp?: unknown }
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : undefined
  } catch {
    return undefined
  }
}

function normalizeToken(value: unknown): StoredToken {
  const response = typeof value === 'string' ? undefined : readTokenResponse(value)
  const rawAccessToken =
    typeof value === 'string' ? value : (response?.access_token ?? response?.accessToken)
  const accessToken =
    typeof rawAccessToken === 'string'
      ? rawAccessToken.trim().replace(/^Bearer\s+/i, '')
      : rawAccessToken
  const tokenType = response?.token_type ?? response?.tokenType
  const rawExpiresIn = response?.expires_in ?? response?.expiresIn

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new TokenServiceError(
      'invalid_response',
      'El servicio de token respondió sin un access token válido.',
    )
  }

  const jwtExpiration = readJwtExpiration(accessToken)
  const parsedExpiresIn = Number(rawExpiresIn)
  const expiresIn =
    Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0
      ? parsedExpiresIn
      : jwtExpiration
        ? Math.max(1, Math.floor((jwtExpiration - Date.now()) / 1000))
        : DEFAULT_TOKEN_LIFETIME_SECONDS

  return {
    accessToken,
    tokenType: typeof tokenType === 'string' && tokenType ? tokenType : DEFAULT_TOKEN_TYPE,
    expiresIn,
    expirationTimestamp: jwtExpiration ?? Date.now() + expiresIn * 1000,
  }
}

function toTokenServiceError(error: unknown): TokenServiceError {
  if (error instanceof TokenServiceError) return error
  if (!axios.isAxiosError(error)) {
    return new TokenServiceError('network_error', 'No fue posible obtener credenciales de acceso.')
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TokenServiceError('timeout', 'El servicio de token excedió el tiempo de espera.')
  }

  const status = error.response?.status
  if (status === 400) {
    return new TokenServiceError(
      'request_rejected',
      'El servicio de token rechazó las credenciales configuradas.',
      status,
    )
  }
  if (status === 401 || status === 403) {
    return new TokenServiceError(
      'request_rejected',
      'El servicio de token no autorizó las credenciales configuradas.',
      status,
    )
  }
  if (status === 404) {
    return new TokenServiceError(
      'service_unavailable',
      'El endpoint de generación de token no está disponible.',
      status,
    )
  }
  if (status && status >= 500) {
    return new TokenServiceError(
      'service_unavailable',
      'El servicio de token presentó un error interno.',
      status,
    )
  }

  return new TokenServiceError(
    'network_error',
    'No fue posible conectar con el servicio de token.',
    status,
  )
}

async function requestNewToken(): Promise<string> {
  try {
    const response = await axios.post<unknown>(TOKEN_ENDPOINT, null, {
      timeout: TOKEN_REQUEST_TIMEOUT_MS,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
    const token = normalizeToken(response.data)
    storeToken(token)
    return token.accessToken
  } catch (error) {
    clearStoredToken()
    throw toTokenServiceError(error)
  }
}

function startTokenRequest(): Promise<string> {
  if (pendingTokenRequest) return pendingTokenRequest

  pendingTokenRequest = requestNewToken().finally(() => {
    pendingTokenRequest = undefined
  })
  return pendingTokenRequest
}

export function getAccessToken(): Promise<string> {
  if (isStoredTokenValid()) return Promise.resolve(getStoredToken()!.accessToken)
  return startTokenRequest()
}

export function refreshToken(rejectedToken?: string): Promise<string> {
  const currentToken = getStoredToken()
  if (
    rejectedToken &&
    currentToken &&
    currentToken.accessToken !== rejectedToken &&
    isStoredTokenValid()
  ) {
    return Promise.resolve(currentToken.accessToken)
  }

  clearStoredToken()
  return startTokenRequest()
}

export function clearToken() {
  clearStoredToken()
}
