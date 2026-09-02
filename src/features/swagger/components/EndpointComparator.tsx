import { CircleAlert, Columns3, ListPlus, X } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { useState } from 'react'
import { MethodBadge } from '../../../components/MethodBadge'
import { useUiStore } from '../../../store/uiStore'
import type { EndpointExecutionRecord, SwaggerEndpoint } from '../../../types/swagger'
import { EndpointResponses } from './EndpointResponses'
import { RequestBuilder } from './RequestBuilder'

interface EndpointComparatorProps {
  endpoints: SwaggerEndpoint[]
  document: OpenAPIV3.Document
}

export function EndpointComparator({ endpoints, document }: EndpointComparatorProps) {
  const [executions, setExecutions] = useState<Record<string, EndpointExecutionRecord | undefined>>(
    {},
  )
  const toggleComparisonEndpoint = useUiStore((state) => state.toggleComparisonEndpoint)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)

  const updateExecution = (endpointId: string, execution?: EndpointExecutionRecord) => {
    setExecutions((current) => {
      const next = { ...current }
      if (execution) next[endpointId] = execution
      else delete next[endpointId]
      return next
    })
  }

  if (!endpoints.length) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-white/[0.025]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <ListPlus size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            Agrega endpoints al comparador
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Usa el selector junto a cada endpoint. Podrás configurar y ejecutar cada operación por
            separado.
          </p>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white lg:hidden"
          >
            <ListPlus size={16} /> Seleccionar endpoints
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300">
            <Columns3 size={19} />
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase">Side-by-side</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Comparador de endpoints
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ejecuta cada operación manualmente; sus parámetros y resultados permanecen aislados.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {endpoints.length} {endpoints.length === 1 ? 'endpoint' : 'endpoints'}
        </span>
      </div>

      {endpoints.length < 2 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <CircleAlert className="mt-0.5 shrink-0" size={17} />
          Selecciona al menos otro endpoint desde el panel lateral para iniciar una comparación.
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-1 gap-5 xl:auto-cols-[minmax(28rem,1fr)] xl:grid-flow-col xl:grid-cols-none">
          {endpoints.map((endpoint) => {
            const execution = executions[endpoint.id]
            return (
              <section
                key={endpoint.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm dark:border-white/10 dark:bg-[#091423]/70"
              >
                <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.025]">
                  <div className="flex items-start gap-3">
                    <MethodBadge method={endpoint.method} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h2 className="line-clamp-2 min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white">
                          {endpoint.summary}
                        </h2>
                        {endpoint.deprecated && (
                          <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                            Deprecado
                          </span>
                        )}
                      </div>
                      <code className="mt-1 block truncate text-[11px] text-slate-500">
                        {endpoint.path}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleComparisonEndpoint(endpoint.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                      aria-label={`Quitar ${endpoint.summary} del comparador`}
                      title="Quitar del comparador"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </header>

                <div className="p-3 sm:p-4">
                  <RequestBuilder
                    endpoint={endpoint}
                    compact
                    initialExecution={execution}
                    onExecutionChange={(record) => updateExecution(endpoint.id, record)}
                  />
                  <EndpointResponses endpoint={endpoint} document={document} compact />
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
