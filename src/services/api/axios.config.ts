import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getActiveApi } from '../../config/env'
import { getAccessToken, refreshToken } from '../auth/token.service'
import { TOKEN_ENDPOINT } from '../auth/token.constants'
import { TokenServiceError } from '../auth/token.types'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _tokenRetry?: boolean
}

let apiClient: AxiosInstance | undefined
let openApiClient: AxiosInstance | undefined

function isTokenRequest(url?: string): boolean {
  if (!url) return false
  try {
    return new URL(url, getActiveApi().baseUrl).pathname.endsWith(TOKEN_ENDPOINT)
  } catch {
    return url.includes(TOKEN_ENDPOINT)
  }
}

function readRejectedToken(config: InternalAxiosRequestConfig): string | undefined {
  const authorization = config.headers.get('Authorization')
  if (typeof authorization !== 'string') return undefined
  const [scheme, token] = authorization.split(' ')
  return scheme?.toLowerCase() === 'bearer' ? token : undefined
}

async function retryUnauthorized(
  client: AxiosInstance,
  config: RetriableRequestConfig,
): Promise<AxiosResponse> {
  if (config._tokenRetry || isTokenRequest(config.url)) {
    return Promise.reject(
      new TokenServiceError(
        'request_rejected',
        'La API rechazó la solicitud después de renovar el token.',
        401,
      ),
    )
  }

  config._tokenRetry = true
  const accessToken = await refreshToken(readRejectedToken(config))
  config.headers = AxiosHeaders.from(config.headers)
  config.headers.set('Authorization', `Bearer ${accessToken}`)
  return client.request(config)
}

export function createAuthenticatedApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getActiveApi().baseUrl,
    timeout: 60_000,
    headers: { Accept: 'application/json' },
  })

  client.interceptors.request.use(async (config) => {
    if (isTokenRequest(config.url)) return config
    const accessToken = await getAccessToken()
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return config
  })

  client.interceptors.response.use(
    (response) => {
      if (response.status !== 401) return response
      return retryUnauthorized(client, response.config as RetriableRequestConfig)
    },
    (error: AxiosError) => {
      if (error.response?.status !== 401 || !error.config) return Promise.reject(error)
      return retryUnauthorized(client, error.config as RetriableRequestConfig)
    },
  )

  return client
}

export function getApiClient(): AxiosInstance {
  const activeApi = getActiveApi()
  if (apiClient?.defaults.baseURL !== activeApi.baseUrl) {
    apiClient = createAuthenticatedApiClient()
  }
  return apiClient
}

export function getOpenApiClient(): AxiosInstance {
  const activeApi = getActiveApi()
  if (openApiClient?.defaults.baseURL !== activeApi.openApiUrl) {
    openApiClient = axios.create({
      baseURL: activeApi.openApiUrl,
      timeout: 30_000,
      headers: { Accept: 'application/json' },
    })
  }
  return openApiClient
}
