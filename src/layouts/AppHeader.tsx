import { useMsal } from '@azure/msal-react'
import { CircleCheck, CircleX, LoaderCircle, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { getActiveApi } from '../config/env'
import { ApiSelector } from '../components/ApiSelector'
import { useApiHealth } from '../hooks/useApiHealth'
import { useOpenApi } from '../hooks/useOpenApi'
import { useUiStore } from '../store/uiStore'
import { useApiSelectionStore } from '../store/apiSelectionStore'
import { getRequestErrorMessage } from '../utils/httpErrors'

type ConnectionState = 'checking' | 'available' | 'unavailable'

export function AppHeader() {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  useApiSelectionStore((state) => state.activeApiId)
  const { instance, accounts } = useMsal()
  const swagger = useOpenApi()
  const api = useApiHealth()
  const activeApi = getActiveApi()
  const baseUrl = activeApi.baseUrl
  useEffect(() => {
    document.title = `${activeApi.name} · API Explorer`
  }, [activeApi.name])
  const swaggerState: ConnectionState = swagger.isLoading
    ? 'checking'
    : swagger.isError
      ? 'unavailable'
      : 'available'
  const apiState: ConnectionState = api.isLoading
    ? 'checking'
    : api.data?.available
      ? 'available'
      : 'unavailable'
  const account = instance.getActiveAccount() ?? accounts[0]

  const logout = () => {
    void instance.logoutRedirect({
      account,
      postLogoutRedirectUri: window.location.origin,
    })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#081321]/90">
      <div className="flex h-full items-center gap-3 px-4 sm:px-5">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden dark:hover:bg-white/5"
          aria-label="Abrir navegación de endpoints"
        >
          <Menu size={20} />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-violet-600 shadow-lg shadow-emerald-500/20">
            <span className="font-mono text-sm font-black text-white">SIS</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {activeApi.name}
            </p>
            <p className="hidden text-[10px] font-semibold tracking-[0.14em] text-emerald-600 uppercase sm:block dark:text-emerald-400">
              API Explorer
            </p>
            <code className="block max-w-28 truncate text-[9px] text-slate-400 sm:hidden">
              {baseUrl}
            </code>
          </div>
        </div>

        <ApiSelector />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ConnectionBadge
            label="Swagger"
            state={swaggerState}
            detail={
              swaggerState === 'available'
                ? `${swagger.data?.endpoints.length ?? 0} operaciones cargadas`
                : swagger.error
                  ? getRequestErrorMessage(swagger.error, 'Swagger')
                  : 'Comprobando definición OpenAPI'
            }
          />
          <ConnectionBadge
            label="API"
            state={apiState}
            detail={api.data?.message ?? 'Comprobando URL base'}
          />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label={account ? `Cerrar sesion de ${account.username}` : 'Cerrar sesion'}
            title={account?.username ?? 'Cerrar sesion'}
          >
            <span className="hidden max-w-36 truncate text-xs font-medium xl:inline">
              {account?.name ?? account?.username}
            </span>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

function ConnectionBadge({
  label,
  state,
  detail,
}: {
  label: string
  state: ConnectionState
  detail: string
}) {
  const appearance: Record<ConnectionState, { text: string; className: string; icon: ReactNode }> =
    {
      checking: {
        text: 'Comprobando',
        className: 'border-slate-400/20 bg-slate-400/10 text-slate-500 dark:text-slate-300',
        icon: <LoaderCircle className="animate-spin" size={13} />,
      },
      available: {
        text: 'Disponible',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        icon: <CircleCheck size={13} />,
      },
      unavailable: {
        text: 'No disponible',
        className: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        icon: <CircleX size={13} />,
      },
    }
  const current = appearance[state]

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1.5 ${current.className}`}
      title={`${label}: ${detail}`}
      aria-label={`${label}: ${current.text}. ${detail}`}
    >
      {current.icon}
      <span className="hidden text-[10px] font-bold sm:inline">{label}</span>
      <span className="hidden text-[10px] lg:inline">{current.text}</span>
    </div>
  )
}
