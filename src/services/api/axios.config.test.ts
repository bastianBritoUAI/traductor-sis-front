import axios, { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setEnvironment } from '../../config/env'
import { clearToken } from '../auth/token.service'
import { createAuthenticatedApiClient, getOpenApiClient } from './axios.config'

function tokenResponse(accessToken: string): AxiosResponse {
  return {
    data: { access_token: accessToken, token_type: 'Bearer', expires_in: 3600 },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  } as AxiosResponse
}

function stringTokenResponse(accessToken: string): AxiosResponse {
  return {
    data: accessToken,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  } as AxiosResponse
}

describe('authenticated Axios client', () => {
  beforeEach(() => {
    setEnvironment({
      azureAdInstance: 'https://login.microsoftonline.com',
      azureAdClientId: 'spa-client-id',
      azureAdTenantId: 'tenant-id',
      apiBaseUrl: 'https://api.example.test',
      openApiUrl: 'https://docs.example.test/swagger/v1/swagger.json',
    })
    clearToken()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearToken()
  })

  it('adds a token, refreshes after 401 and retries exactly once', async () => {
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce(stringTokenResponse('first-token'))
      .mockResolvedValueOnce(stringTokenResponse('renewed-token'))
    const authorizations: Array<string | undefined> = []
    let requests = 0
    const adapter: AxiosAdapter = (config) => {
      requests += 1
      const headers = AxiosHeaders.from(config.headers)
      const authorization = headers.get('Authorization')
      authorizations.push(typeof authorization === 'string' ? authorization : undefined)
      return Promise.resolve({
        data: requests === 1 ? { error: 'unauthorized' } : { ok: true },
        status: requests === 1 ? 401 : 200,
        statusText: requests === 1 ? 'Unauthorized' : 'OK',
        headers: new AxiosHeaders(),
        config,
      })
    }
    const client = createAuthenticatedApiClient()

    const response = await client.get('/resource', {
      adapter,
      validateStatus: () => true,
    })

    expect(response.status).toBe(200)
    expect(requests).toBe(2)
    expect(authorizations).toEqual(['Bearer first-token', 'Bearer renewed-token'])
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('keeps APIM and the OpenAPI document on independent origins', () => {
    const apiClient = createAuthenticatedApiClient()

    expect(apiClient.getUri({ url: '/api/level' })).toBe('https://api.example.test/api/level')
    expect(getOpenApiClient().getUri({ url: '' })).toBe(
      'https://docs.example.test/swagger/v1/swagger.json',
    )
  })

  it('stops after the single configured retry', async () => {
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce(tokenResponse('first-token'))
      .mockResolvedValueOnce(tokenResponse('renewed-token'))
    let requests = 0
    const adapter: AxiosAdapter = (config) => {
      requests += 1
      return Promise.resolve({
        data: { error: 'unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config,
      })
    }
    const client = createAuthenticatedApiClient()

    await expect(client.get('/resource', { adapter, validateStatus: () => true })).rejects.toThrow(
      'después de renovar el token',
    )
    expect(requests).toBe(2)
    expect(post).toHaveBeenCalledTimes(2)
  })
})
