import { InteractionStatus } from '@azure/msal-browser'
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { getAccessToken } from '../services/auth/token.service'
import { loginRequest } from './msalConfig'

function TokenPreloader() {
  useEffect(() => {
    void getAccessToken().catch(() => undefined)
  }, [])

  return null
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { instance, inProgress } = useMsal()
  const redirectInProgress = useRef(false)

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || redirectInProgress.current) return

    let active = true
    void instance.handleRedirectPromise().then((response) => {
      if (!active) return

      if (response?.account) {
        instance.setActiveAccount(response.account)
        return
      }

      const accounts = instance.getAllAccounts()
      const firstAccount = accounts[0]
      if (firstAccount) {
        if (!instance.getActiveAccount()) instance.setActiveAccount(firstAccount)
        return
      }

      redirectInProgress.current = true
      void instance.loginRedirect(loginRequest)
    })

    return () => {
      active = false
    }
  }, [instance, inProgress])

  return (
    <>
      <AuthenticatedTemplate>
        <TokenPreloader />
        {children}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoadingScreen label="Preparando inicio de sesion..." />
      </UnauthenticatedTemplate>
    </>
  )
}
