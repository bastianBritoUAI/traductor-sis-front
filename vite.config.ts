import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const PUBLIC_ENV_PREFIXES = [
  'VITE_AZURE_AD_INSTANCE',
  'VITE_AZURE_AD_CLIENT_ID',
  'VITE_AZURE_AD_TENANT_ID',
  'VITE_SIS_TRADUCTOR_BASE_URL',
  'VITE_SIS_TRADUCTOR_OPENAPI_URL',
  'VITE_API_BASE_URL_REGLAMENTO',
  'VITE_API_OPENAPI_URL_REGLAMENTO',
]

const TOKEN_CREDENTIALS = {
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
} as const

function tokenProxyPlugin(environment: Record<string, string>): Plugin {
  return {
    name: 'token-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tokenApi', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'POST')
          response.end('Method Not Allowed')
          return
        }

        let rawBody = ''
        for await (const chunk of request) rawBody += String(chunk)
        let apiId: keyof typeof TOKEN_CREDENTIALS = 'traductor'
        try {
          const body = JSON.parse(rawBody) as { apiId?: string }
          if (body.apiId && body.apiId in TOKEN_CREDENTIALS) {
            apiId = body.apiId as keyof typeof TOKEN_CREDENTIALS
          }
        } catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Invalid token request.' }))
          return
        }

        const credentialNames = TOKEN_CREDENTIALS[apiId]
        const tenantId = environment.AZURE_AD_TENANT_ID || environment.VITE_AZURE_AD_TENANT_ID
        const scope = environment[credentialNames.scope]
        const clientId = environment[credentialNames.clientId]
        const clientSecret = environment[credentialNames.clientSecret]

        if (!tenantId || !scope || !clientId || !clientSecret) {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Token service configuration is incomplete.' }))
          return
        }

        try {
          const tokenResponse = await fetch(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope,
              }),
            },
          )
          const body = await tokenResponse.text()

          response.statusCode = tokenResponse.status
          response.setHeader('Content-Type', 'application/json')
          response.setHeader('Cache-Control', 'no-store')
          response.end(body)
        } catch (error) {
          console.error(`Error al obtener el token de ${apiId}.`, error)
          response.statusCode = 502
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Token service is unavailable.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')

  return {
    envPrefix: PUBLIC_ENV_PREFIXES,
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](?:react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'auth-vendor',
                test: /node_modules[\\/]@azure[\\/]msal-/,
                priority: 20,
              },
              {
                name: 'http-vendor',
                test: /node_modules[\\/]axios[\\/]/,
                priority: 20,
              },
            ],
          },
        },
      },
    },
    plugins: [react(), tailwindcss(), tokenProxyPlugin(environment)],
    server: {
      port: 5173,
    },
    preview: {
      port: 4173,
    },
  }
})
