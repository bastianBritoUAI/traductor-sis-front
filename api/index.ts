/// <reference types="node" />
import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions'

type ApiId = 'traductor' | 'reglamento' | 'titulacion'

interface TokenConfiguration {
  tenantId: string
  scope: string
  clientId: string
  clientSecret: string
}

const tokenVariables: Record<ApiId, Omit<Record<keyof TokenConfiguration, string>, 'tenantId'>> = {
  traductor: {
    scope: 'SIS_TRADUCTOR_SCOPE',
    clientId: 'SIS_TRADUCTOR_CLIENT_ID',
    clientSecret: 'SIS_TRADUCTOR_CLIENT_SECRET',
  },
  reglamento: {
    scope: 'REGLAMENTOS_SCOPE',
    clientId: 'REGLAMENTOS_CLIENT_ID',
    clientSecret: 'REGLAMENTOS_CLIENT_SECRET',
  },
  titulacion: {
    scope: 'TITULACION_API_SCOPE',
    clientId: 'TITULACION_API_CLIENT_ID',
    clientSecret: 'TITULACION_API_CLIENT_SECRET',
  },
}

function readTokenConfiguration(apiId: ApiId): TokenConfiguration {
  const variableNames = {
    tenantId: 'AZURE_AD_TENANT_ID',
    ...tokenVariables[apiId],
  }

  const missing = Object.values(variableNames).filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) {
    throw new Error(`Missing token configuration: ${missing.join(', ')}`)
  }

  return {
    tenantId: process.env[variableNames.tenantId]!,
    scope: process.env[variableNames.scope]!,
    clientId: process.env[variableNames.clientId]!,
    clientSecret: process.env[variableNames.clientSecret]!,
  }
}

app.http('tokenApi', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const requestWithJson = request as unknown as { json: () => Promise<unknown> }
      const tokenRequest = (await requestWithJson.json()) as { apiId?: unknown }
      const apiId = tokenRequest.apiId
      if (apiId !== 'traductor' && apiId !== 'reglamento' && apiId !== 'titulacion') {
        return {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
          jsonBody: { error: 'Invalid API selection.' },
        }
      }
      const configuration = readTokenConfiguration(apiId)
      const tokenUrl = `https://login.microsoftonline.com/${configuration.tenantId}/oauth2/v2.0/token`
      const tokenBody = new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        grant_type: 'client_credentials',
        scope: configuration.scope,
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody,
      })
      const responseText = await response.text()
      let responseBody: unknown

      try {
        responseBody = JSON.parse(responseText)
      } catch {
        responseBody = { error: 'Identity provider returned an invalid response.' }
      }

      return {
        status: response.status,
        headers: { 'Cache-Control': 'no-store' },
        jsonBody: responseBody,
      }
    } catch (error) {
      context.error('Error al obtener el token de la API seleccionada.', error)
      return {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
        jsonBody: { error: 'Internal Server Error' },
      }
    }
  },
})
