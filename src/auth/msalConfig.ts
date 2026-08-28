import { LogLevel, type Configuration, type RedirectRequest } from '@azure/msal-browser'
import { getEnvironment } from '../config/env'

export function createMsalConfig(): Configuration {
  const environment = getEnvironment()

  return {
    auth: {
      clientId: environment.azureAdClientId,
      authority: `${environment.azureAdInstance}/${environment.azureAdTenantId}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  }
}

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
}
