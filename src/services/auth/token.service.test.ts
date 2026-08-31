import axios, { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActiveApi, setEnvironment } from '../../config/env'
import { clearToken, getAccessToken, refreshToken } from './token.service'
import { getStoredToken } from './token.storage'

function tokenResponse(accessToken: string, expiresIn = 3600): AxiosResponse {
  return {
    data: {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
    },
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

describe('token service', () => {
  beforeEach(() => {
    setEnvironment({
      azureAdInstance: 'https://login.microsoftonline.com',
      azureAdClientId: 'spa-client-id',
      azureAdTenantId: 'tenant-id',
      defaultApiId: 'traductor',
      apis: [
        {
          id: 'traductor',
          name: 'Traductor SIS',
          baseUrl: 'https://api.example.test',
          openApiUrl: 'https://docs.example.test/swagger/v1/swagger.json',
        },
        {
          id: 'reglamento',
          name: 'Reglamento SIS',
          baseUrl: 'https://reglamento.example.test',
          openApiUrl: 'https://reglamento-docs.example.test/swagger/v1/swagger.json',
        },
        {
          id: 'titulacion',
          name: 'Titulación SIS',
          baseUrl: 'https://titulacion.example.test',
          openApiUrl: 'https://titulacion-docs.example.test/swagger/v1/swagger.json',
        },
      ],
    })
    clearToken()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearToken()
  })

  it('shares one token request among concurrent consumers', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(tokenResponse('shared-token'))

    const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()])

    expect(tokens).toEqual(['shared-token', 'shared-token', 'shared-token'])
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0]?.[0]).toBe('/api/tokenApi')
    expect(post.mock.calls[0]?.[1]).toEqual({ apiId: 'traductor' })
    expect(getStoredToken()).toMatchObject({
      accessToken: 'shared-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    expect(getStoredToken()!.expirationTimestamp).toBeGreaterThan(Date.now())
  })

  it('accepts a plain string response and normalizes an existing Bearer prefix', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue(stringTokenResponse('Bearer plain-access-token'))

    expect(await getAccessToken()).toBe('plain-access-token')
    expect(getStoredToken()).toMatchObject({
      accessToken: 'plain-access-token',
      tokenType: 'Bearer',
    })
  })

  it('requests credentials for the currently selected API', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(tokenResponse('titulacion-token'))
    setActiveApi('titulacion')

    await getAccessToken()

    expect(post.mock.calls[0]?.[0]).toBe('/api/tokenApi')
    expect(post.mock.calls[0]?.[1]).toEqual({ apiId: 'titulacion' })
  })

  it('reuses a valid token and renews it inside the 60 second buffer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce(tokenResponse('first-token', 120))
      .mockResolvedValueOnce(tokenResponse('renewed-token', 120))

    expect(await getAccessToken()).toBe('first-token')
    expect(await getAccessToken()).toBe('first-token')
    vi.advanceTimersByTime(61_000)
    expect(await getAccessToken()).toBe('renewed-token')
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('does not discard a newer token when a late 401 reports the previous one', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(tokenResponse('new-token'))

    await getAccessToken()
    expect(await refreshToken('old-rejected-token')).toBe('new-token')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('returns a sanitized error when credentials are rejected', async () => {
    const error = new AxiosError('upstream-sensitive-detail', 'ERR_BAD_REQUEST')
    error.response = { status: 400 } as AxiosResponse
    vi.spyOn(axios, 'post').mockRejectedValue(error)

    const thrown = await getAccessToken().catch((caught: unknown) => caught)
    expect(thrown).toBeInstanceOf(Error)
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    expect(message).toContain('rechazó las credenciales configuradas')
    expect(message).not.toContain('upstream-sensitive-detail')
  })
})
