import { PublicClientApplication } from '@azure/msal-browser'
import { createMsalConfig } from './msalConfig'

let msalInstance: PublicClientApplication | undefined

export function getMsalInstance(): PublicClientApplication {
  msalInstance ??= new PublicClientApplication(createMsalConfig())
  return msalInstance
}
