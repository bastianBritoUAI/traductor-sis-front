import { describe, expect, it } from 'vitest'
import { validateEnvironment } from './env'

describe('environment configuration', () => {
  it('normalizes a complete API configuration', () => {
    expect(
      validateEnvironment({
        VITE_AZURE_AD_INSTANCE: 'https://login.microsoftonline.com/',
        VITE_AZURE_AD_CLIENT_ID: 'spa-client-id',
        VITE_AZURE_AD_TENANT_ID: 'tenant-id',
        VITE_SIS_TRADUCTOR_BASE_URL: 'https://api.example.test/',
        VITE_SIS_TRADUCTOR_OPENAPI_URL: 'https://docs.example.test/swagger/v1/swagger.json',
      }),
    ).toEqual({
      success: true,
      data: {
        azureAdInstance: 'https://login.microsoftonline.com',
        azureAdClientId: 'spa-client-id',
        azureAdTenantId: 'tenant-id',
        apiBaseUrl: 'https://api.example.test',
        openApiUrl: 'https://docs.example.test/swagger/v1/swagger.json',
      },
    })
  })

  it('reports missing or invalid credentials', () => {
    expect(
      validateEnvironment({
        VITE_AZURE_AD_INSTANCE: 'not-a-url',
        VITE_AZURE_AD_CLIENT_ID: '',
        VITE_AZURE_AD_TENANT_ID: '',
        VITE_SIS_TRADUCTOR_BASE_URL: 'not-a-url',
        VITE_SIS_TRADUCTOR_OPENAPI_URL: 'not-a-url',
      }).success,
    ).toBe(false)
  })
})
