import { AlertTriangle, Columns3, FileText, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { useOpenApi } from '../../../hooks/useOpenApi'
import { useUiStore } from '../../../store/uiStore'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { getRequestErrorMessage } from '../../../utils/httpErrors'
import { EndpointComparator } from './EndpointComparator'
import { EndpointList } from './EndpointList'
import { SidebarSwagger } from './SidebarSwagger'

export function SwaggerExplorer() {
  const { data, isLoading, isError, error, refetch, isFetching } = useOpenApi()
  const expandedEndpointIds = useUiStore((state) => state.expandedEndpointIds)
  const toggleEndpointDetails = useUiStore((state) => state.toggleEndpointDetails)
  const explorerView = useUiStore((state) => state.explorerView)
  const setExplorerView = useUiStore((state) => state.setExplorerView)
  const comparisonEndpointIds = useUiStore((state) => state.comparisonEndpointIds)
  const toggleComparisonEndpoint = useUiStore((state) => state.toggleComparisonEndpoint)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)

  const comparisonEndpoints = useMemo(
    () =>
      comparisonEndpointIds
        .map((id) => data?.endpoints.find((endpoint) => endpoint.id === id))
        .filter((endpoint): endpoint is SwaggerEndpoint => Boolean(endpoint)),
    [comparisonEndpointIds, data?.endpoints],
  )

  if (isLoading) return <ExplorerSkeleton />

  if (isError || !data) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-white p-7 text-center shadow-xl dark:bg-[#0c1726]">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            No pudimos cargar OpenAPI
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {getRequestErrorMessage(error, 'Swagger')}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white"
          >
            <RefreshCw className={isFetching ? 'animate-spin' : ''} size={15} /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="hidden shrink-0 lg:block">
        <SidebarSwagger
          endpoints={data.endpoints}
          apiTitle={data.document.info.title}
          apiVersion={data.document.info.version}
          desktop
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar navegación"
          />
          <div className="relative h-full w-fit shadow-2xl">
            <SidebarSwagger
              endpoints={data.endpoints}
              apiTitle={data.document.info.title}
              apiVersion={data.document.info.version}
            />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[#07101d]">
        <div className="sticky top-0 z-30 flex items-center gap-1 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-[#081321]/90">
          <button
            type="button"
            onClick={() => setExplorerView('details')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${explorerView === 'details' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            aria-pressed={explorerView === 'details'}
          >
            <FileText size={15} /> Endpoints
          </button>
          <button
            type="button"
            onClick={() => setExplorerView('compare')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${explorerView === 'compare' ? 'bg-violet-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            aria-pressed={explorerView === 'compare'}
          >
            <Columns3 size={15} /> Comparador
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${explorerView === 'compare' ? 'bg-slate-950/10' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              {comparisonEndpoints.length}
            </span>
          </button>
          <span className="ml-auto hidden text-[10px] text-slate-400 sm:block">
            {explorerView === 'compare'
              ? 'Las ejecuciones son independientes'
              : 'Documentación y prueba de múltiples endpoints'}
          </span>
        </div>

        <div className={explorerView === 'details' ? 'block' : 'hidden'}>
          <EndpointList
            endpoints={data.endpoints}
            document={data.document}
            apiTitle={data.document.info.title}
            apiVersion={data.document.info.version}
            expandedEndpointIds={expandedEndpointIds}
            comparisonEndpointIds={comparisonEndpointIds}
            onToggleDetails={toggleEndpointDetails}
            onToggleComparison={toggleComparisonEndpoint}
          />
        </div>
        <div className={explorerView === 'compare' ? 'block' : 'hidden'}>
          <EndpointComparator endpoints={comparisonEndpoints} document={data.document} />
        </div>
      </main>
    </div>
  )
}

function ExplorerSkeleton() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse overflow-hidden">
      <aside
        className={`hidden border-r border-slate-200 bg-white lg:block dark:border-white/10 dark:bg-[#091423] ${sidebarCollapsed ? 'w-14 p-2' : 'w-[360px] p-4'}`}
      >
        {sidebarCollapsed ? (
          <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5" />
        ) : (
          <>
            <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-5 h-10 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-9 rounded-lg bg-slate-100 dark:bg-white/5" />
              ))}
            </div>
          </>
        )}
      </aside>
      <main className="flex-1 bg-slate-50 p-8 dark:bg-[#07101d]">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="h-10 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-24 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-12 rounded-lg bg-slate-200 dark:bg-white/10" />
        </div>
      </main>
    </div>
  )
}
