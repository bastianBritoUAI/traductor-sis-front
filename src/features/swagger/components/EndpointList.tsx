import { Check, ChevronRight, Folder, List, Plus, Search, X } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { useMemo, useState } from 'react'
import { MethodBadge } from '../../../components/MethodBadge'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { getEndpointElementId } from '../../../utils/endpointDom'
import { plainText } from '../../../utils/openapi'
import { EndpointDetails } from './EndpointDetails'

interface EndpointListProps {
  endpoints: SwaggerEndpoint[]
  document: OpenAPIV3.Document
  apiTitle: string
  apiVersion: string
  expandedEndpointIds: string[]
  comparisonEndpointIds: string[]
  onToggleDetails: (endpointId: string) => void
  onToggleComparison: (endpointId: string) => void
}

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

export function EndpointList({
  endpoints,
  document,
  apiTitle,
  apiVersion,
  expandedEndpointIds,
  comparisonEndpointIds,
  onToggleDetails,
  onToggleComparison,
}: EndpointListProps) {
  const [search, setSearch] = useState('')
  const filteredEndpoints = useMemo(() => {
    const term = normalizeSearchValue(search.trim())
    if (!term) return endpoints

    const terms = term.split(/\s+/)
    return endpoints.filter((endpoint) => {
      const searchable = normalizeSearchValue(
        [
          endpoint.method,
          endpoint.path,
          endpoint.summary,
          endpoint.description,
          endpoint.operationId,
          ...endpoint.tags,
        ]
          .filter(Boolean)
          .map((value) => plainText(value))
          .join(' '),
      )
      return terms.every((searchTerm) => searchable.includes(searchTerm))
    })
  }, [endpoints, search])
  const endpointsByController = useMemo(
    () =>
      Object.entries(
        filteredEndpoints.reduce<Record<string, SwaggerEndpoint[]>>((groups, endpoint) => {
          const controller = endpoint.tags[0] ?? 'General'
          groups[controller] = [...(groups[controller] ?? []), endpoint]
          return groups
        }, {}),
      ),
    [filteredEndpoints],
  )

  return (
    <section className="w-full px-3 py-6 sm:px-4 lg:px-5 lg:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
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
        <p className="text-sm text-slate-500">
          Expande uno o varios endpoints para revisar y probar sus operaciones.
        </p>
      </header>

      {endpoints.length > 0 && (
        <div className="sticky top-[49px] z-20 -mx-3 mb-6 flex flex-wrap items-center gap-3 border-y border-slate-200/80 bg-slate-50/95 px-3 py-3 shadow-sm backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5 dark:border-white/10 dark:bg-[#07101d]/95">
          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, ruta, método o controlador…"
              aria-label="Buscar endpoints"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-9 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:focus:border-emerald-500/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Limpiar búsqueda de endpoints"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {search.trim() && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {filteredEndpoints.length}{' '}
              {filteredEndpoints.length === 1 ? 'coincidencia' : 'coincidencias'}
            </span>
          )}
        </div>
      )}

      {endpointsByController.length ? (
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
              <div className="space-y-2">
                {controllerEndpoints.map((endpoint) => {
                  const expanded = expandedEndpointIds.includes(endpoint.id)
                  const compared = comparisonEndpointIds.includes(endpoint.id)
                  const endpointElementId = getEndpointElementId(endpoint.id)
                  const detailsId = `${endpointElementId}-details`

                  return (
                    <div
                      id={endpointElementId}
                      key={endpoint.id}
                      className={`scroll-mt-16 overflow-hidden rounded-xl border transition-colors ${expanded ? 'border-emerald-400/70 bg-emerald-50/80 shadow-sm shadow-emerald-500/10 dark:border-emerald-400/40 dark:bg-emerald-500/[0.08]' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.025]'}`}
                    >
                      <div
                        className={`group flex items-center gap-2 transition ${expanded ? 'bg-emerald-500/[0.06]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.06]'}`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleDetails(endpoint.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-500"
                          aria-expanded={expanded}
                          aria-controls={detailsId}
                          aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${endpoint.summary}`}
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
                            className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90 text-emerald-600 dark:text-emerald-400' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}
                            size={18}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleComparison(endpoint.id)}
                          className={`mr-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:mr-2 ${compared ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/20' : 'border border-slate-200 text-slate-500 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-600 dark:border-white/10 dark:text-slate-300 dark:hover:text-violet-300'}`}
                          aria-pressed={compared}
                          aria-label={`${compared ? 'Quitar' : 'Agregar'} ${endpoint.summary} ${compared ? 'del' : 'al'} comparador`}
                          title={compared ? 'Quitar del comparador' : 'Agregar al comparador'}
                        >
                          {compared ? <Check size={14} /> : <Plus size={14} />}
                          <span className="hidden sm:inline">
                            {compared ? 'Seleccionado' : 'Comparar'}
                          </span>
                        </button>
                      </div>

                      {expanded && (
                        <div
                          id={detailsId}
                          className="border-t border-emerald-500/25 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-950/10"
                        >
                          <EndpointDetails
                            endpoint={endpoint}
                            document={document}
                            onClose={() => onToggleDetails(endpoint.id)}
                            embedded
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : endpoints.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-white/15">
          <Search className="mx-auto text-slate-300 dark:text-slate-600" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            No encontramos endpoints
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba con otro nombre, ruta, método o controlador.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500 dark:border-white/15">
          No hay endpoints disponibles en la definición OpenAPI.
        </div>
      )}
    </section>
  )
}
