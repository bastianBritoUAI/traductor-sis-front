import { EventType, type AccountInfo } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from './app/AppProviders'
import { getMsalInstance } from './auth/msalInstance'
import { setEnvironment, validateEnvironment } from './config/env'
import { ConfigurationErrorPage } from './pages/ConfigurationErrorPage'
import { AppRoutes } from './routes/AppRoutes'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('No se encontró el elemento raíz de la aplicación.')
const root = createRoot(rootElement)

function renderConfigurationError(errors: string[]) {
  root.render(
    <StrictMode>
      <ConfigurationErrorPage errors={errors} />
    </StrictMode>,
  )
}

async function bootstrap() {
  const validation = validateEnvironment({
    VITE_AZURE_AD_INSTANCE: import.meta.env.VITE_AZURE_AD_INSTANCE,
    VITE_AZURE_AD_CLIENT_ID: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    VITE_AZURE_AD_TENANT_ID: import.meta.env.VITE_AZURE_AD_TENANT_ID,
    VITE_SIS_TRADUCTOR_BASE_URL: import.meta.env.VITE_SIS_TRADUCTOR_BASE_URL,
    VITE_SIS_TRADUCTOR_OPENAPI_URL: import.meta.env.VITE_SIS_TRADUCTOR_OPENAPI_URL,
  })

  if (!validation.success) {
    renderConfigurationError(validation.errors)
    return
  }

  setEnvironment(validation.data)
  const msalInstance = getMsalInstance()

  await msalInstance.initialize()
  msalInstance.addEventCallback((event) => {
    if (event.eventType !== EventType.LOGIN_SUCCESS || !event.payload) return
    const account = (event.payload as { account?: AccountInfo }).account
    if (account) msalInstance.setActiveAccount(account)
  })

  const accounts = msalInstance.getAllAccounts()
  const firstAccount = accounts[0]
  if (!msalInstance.getActiveAccount() && firstAccount) {
    msalInstance.setActiveAccount(firstAccount)
  }

  root.render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </MsalProvider>
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  renderConfigurationError(['MSAL: no fue posible inicializar la sesión de Microsoft.'])
})
