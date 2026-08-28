import { z } from 'zod'

const requiredUrl = z.url('debe ser una URL válida')
const requiredText = z.string().trim().min(1, 'es obligatoria')

const environmentSchema = z.object({
  VITE_AZURE_AD_INSTANCE: requiredUrl,
  VITE_AZURE_AD_CLIENT_ID: requiredText,
  VITE_AZURE_AD_TENANT_ID: requiredText,
  VITE_SIS_TRADUCTOR_BASE_URL: requiredUrl,
  VITE_SIS_TRADUCTOR_OPENAPI_URL: requiredUrl,
})

export interface EnvironmentConfig {
  azureAdInstance: string
  azureAdClientId: string
  azureAdTenantId: string
  apiBaseUrl: string
  openApiUrl: string
}

export type EnvironmentValidation =
  { success: true; data: EnvironmentConfig } | { success: false; errors: string[] }

let environment: EnvironmentConfig | undefined

type EnvironmentSource = z.input<typeof environmentSchema>

export function validateEnvironment(source: EnvironmentSource): EnvironmentValidation {
  const result = environmentSchema.safeParse(source)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`),
    }
  }

  const baseUrl = result.data.VITE_SIS_TRADUCTOR_BASE_URL.replace(/\/$/, '')
  const azureAdInstance = result.data.VITE_AZURE_AD_INSTANCE.replace(/\/$/, '')

  return {
    success: true,
    data: {
      azureAdInstance,
      azureAdClientId: result.data.VITE_AZURE_AD_CLIENT_ID,
      azureAdTenantId: result.data.VITE_AZURE_AD_TENANT_ID,
      apiBaseUrl: baseUrl,
      openApiUrl: result.data.VITE_SIS_TRADUCTOR_OPENAPI_URL,
    },
  }
}

export function setEnvironment(config: EnvironmentConfig) {
  environment = config
}

export function getEnvironment(): EnvironmentConfig {
  if (!environment) {
    throw new Error('La configuración de entorno no ha sido inicializada.')
  }

  return environment
}
