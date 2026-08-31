import { ChevronRight, Folder, List } from 'lucide-react'
import { useMemo } from 'react'
import { MethodBadge } from '../../../components/MethodBadge'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { plainText } from '../../../utils/openapi'

interface EndpointListProps {
  endpoints: SwaggerEndpoint[]
  apiTitle: string
  apiVersion: string
  onSelect: (endpointId: string) => void
}

export function EndpointList({ endpoints, apiTitle, apiVersion, onSelect }: EndpointListProps) {
  const endpointsByController = useMemo(
    () =>
      Object.entries(
        endpoints.reduce<Record<string, SwaggerEndpoint[]>>((groups, endpoint) => {
          const controller = endpoint.tags[0] ?? 'General'
          groups[controller] = [...(groups[controller] ?? []), endpoint]
          return groups
        }, {}),
      ),
    [endpoints],
  )

  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <List size={18} />
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase">Endpoints</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {apiTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {apiVersion} · {endpoints.length} {endpoints.length === 1 ? 'operación' : 'operaciones'}
          </p>
        </div>
        <p className="text-sm text-slate-500">Selecciona un endpoint para ver su detalle.</p>
      </header>

      {endpoints.length ? (
        <div className="space-y-6">
          {endpointsByController.map(([controller, controllerEndpoints]) => (
            <section key={controller} aria-labelledby={`controller-${controller}`}>
              <div className="mb-2 flex items-center gap-2 px-1 text-slate-600 dark:text-slate-300">
                <Folder className="text-emerald-600 dark:text-emerald-400" size={16} />
                <h2 id={`controller-${controller}`} className="text-sm font-bold">
                  {controller}
                </h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  {controllerEndpoints.length}{' '}
                  {controllerEndpoints.length === 1 ? 'endpoint' : 'endpoints'}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.025]">
                {controllerEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    type="button"
                    onClick={() => onSelect(endpoint.id)}
                    className="group flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-500 dark:border-white/10 dark:hover:bg-white/[0.06]"
                  >
                    <MethodBadge method={endpoint.method} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {plainText(endpoint.summary) || endpoint.path}
                        </span>
                        {endpoint.deprecated && (
                          <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                            Deprecado
                          </span>
                        )}
                      </span>
                      <code className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {endpoint.path}
                      </code>
                    </span>
                    <ChevronRight
                      className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                      size={18}
                    />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500 dark:border-white/15">
          No hay endpoints disponibles en la definición OpenAPI.
        </div>
      )}
    </section>
  )
}
