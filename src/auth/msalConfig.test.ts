import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setEnvironment } from '../config/env'
import { createMsalConfig, loginRequest } from './msalConfig'

describe('MSAL configuration', () => {
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
      ],
    })
    vi.stubGlobal('window', { location: { origin: 'https://spa.example.test' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the tenant authority, current origin and session storage', () => {
    const configuration = createMsalConfig()

    expect(configuration.auth).toMatchObject({
      clientId: 'spa-client-id',
      authority: 'https://login.microsoftonline.com/tenant-id',
      redirectUri: 'https://spa.example.test',
      postLogoutRedirectUri: 'https://spa.example.test',
    })
    expect(configuration.cache?.cacheLocation).toBe('sessionStorage')
    expect(loginRequest.scopes).toEqual(['User.Read', 'openid', 'profile', 'email'])
  })
})
