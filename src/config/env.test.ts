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
        VITE_API_BASE_URL_REGLAMENTO: 'https://reglamento.example.test/',
        VITE_API_OPENAPI_URL_REGLAMENTO:
          'https://reglamento-docs.example.test/swagger/v1/swagger.json',
        VITE_TITULACION_API_BASE_URL: 'https://titulacion.example.test/',
        VITE_TITULACION_API_OPENAPI_URL:
          'https://titulacion-docs.example.test/swagger/v1/swagger.json',
      }),
    ).toEqual({
      success: true,
      data: {
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
        VITE_API_BASE_URL_REGLAMENTO: 'not-a-url',
        VITE_API_OPENAPI_URL_REGLAMENTO: 'not-a-url',
        VITE_TITULACION_API_BASE_URL: 'not-a-url',
        VITE_TITULACION_API_OPENAPI_URL: 'not-a-url',
      }).success,
    ).toBe(false)
  })
})
