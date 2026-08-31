import { z } from 'zod'

const requiredUrl = z.url('debe ser una URL válida')
const requiredText = z.string().trim().min(1, 'es obligatoria')

const environmentSchema = z.object({
  VITE_AZURE_AD_INSTANCE: requiredUrl,
  VITE_AZURE_AD_CLIENT_ID: requiredText,
  VITE_AZURE_AD_TENANT_ID: requiredText,
  VITE_SIS_TRADUCTOR_BASE_URL: requiredUrl,
  VITE_SIS_TRADUCTOR_OPENAPI_URL: requiredUrl,
  VITE_API_BASE_URL_REGLAMENTO: requiredUrl,
  VITE_API_OPENAPI_URL_REGLAMENTO: requiredUrl,
})

export interface ApiConfiguration {
  id: 'traductor' | 'reglamento'
  name: string
  baseUrl: string
  openApiUrl: string
}

export interface EnvironmentConfig {
  azureAdInstance: string
  azureAdClientId: string
  azureAdTenantId: string
  apis: ApiConfiguration[]
  defaultApiId: ApiConfiguration['id']
}

export type EnvironmentValidation =
  { success: true; data: EnvironmentConfig } | { success: false; errors: string[] }

let environment: EnvironmentConfig | undefined
let activeApiId: ApiConfiguration['id'] | undefined

type EnvironmentSource = z.input<typeof environmentSchema>

export function validateEnvironment(source: EnvironmentSource): EnvironmentValidation {
  const result = environmentSchema.safeParse(source)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`),
    }
  }

  const azureAdInstance = result.data.VITE_AZURE_AD_INSTANCE.replace(/\/$/, '')

  return {
    success: true,
    data: {
      azureAdInstance,
      azureAdClientId: result.data.VITE_AZURE_AD_CLIENT_ID,
      azureAdTenantId: result.data.VITE_AZURE_AD_TENANT_ID,
      defaultApiId: 'traductor',
      apis: [
        {
          id: 'traductor',
          name: 'Traductor SIS',
          baseUrl: result.data.VITE_SIS_TRADUCTOR_BASE_URL.replace(/\/$/, ''),
          openApiUrl: result.data.VITE_SIS_TRADUCTOR_OPENAPI_URL,
        },
        {
          id: 'reglamento',
          name: 'Reglamento SIS',
          baseUrl: result.data.VITE_API_BASE_URL_REGLAMENTO.replace(/\/$/, ''),
          openApiUrl: result.data.VITE_API_OPENAPI_URL_REGLAMENTO,
        },
      ],
    },
  }
}

export function setEnvironment(config: EnvironmentConfig) {
  environment = config
  activeApiId = config.defaultApiId
}

export function getEnvironment(): EnvironmentConfig {
  if (!environment) {
    throw new Error('La configuración de entorno no ha sido inicializada.')
  }

  return environment
}

export function getAvailableApis(): ApiConfiguration[] {
  return getEnvironment().apis
}

export function getActiveApi(): ApiConfiguration {
  const api = getAvailableApis().find((item) => item.id === activeApiId)
  if (!api) throw new Error('No hay una API activa configurada.')
  return api
}

export function setActiveApi(id: ApiConfiguration['id']) {
  if (!getAvailableApis().some((api) => api.id === id)) {
    throw new Error(`La API "${id}" no está configurada.`)
  }
  activeApiId = id
}
