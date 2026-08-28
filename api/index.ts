/// <reference types="node" />
import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions'

interface TokenConfiguration {
  tenantId: string
  scope: string
  clientId: string
  clientSecret: string
}

function readTokenConfiguration(): TokenConfiguration {
  const variableNames = {
    tenantId: 'AZURE_AD_TENANT_ID',
    scope: 'SIS_TRADUCTOR_SCOPE',
    clientId: 'SIS_TRADUCTOR_CLIENT_ID',
    clientSecret: 'SIS_TRADUCTOR_CLIENT_SECRET',
  } as const

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

app.http('tokenApiTraductor', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const configuration = readTokenConfiguration()
      const tokenUrl = `https://login.microsoftonline.com/${configuration.tenantId}/oauth2/v2.0/token`
      const body = new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        grant_type: 'client_credentials',
        scope: configuration.scope,
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
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
      context.error('Error al obtener el token de Traductor SIS.', error)
      return {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
        jsonBody: { error: 'Internal Server Error' },
      }
    }
  },
})
