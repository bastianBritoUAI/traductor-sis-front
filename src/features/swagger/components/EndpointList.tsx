import { Check, ChevronRight, Folder, List, Plus, Search, X } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { useMemo, useState } from 'react'
import { MethodBadge } from '../../../components/MethodBadge'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { getEndpointElementId } from '../../../utils/endpointDom'
import { plainText } from '../../../utils/openapi'
import { methodContainerStyles } from '../methodStyles'
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
    <section className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
        <div className="sticky top-[49px] z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-y border-slate-200/80 bg-slate-50/95 px-4 py-3 shadow-sm backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-white/10 dark:bg-[#07101d]/95">
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
        <div className="space-y-8">
          {endpointsByController.map(([controller, controllerEndpoints]) => (
            <section key={controller} aria-labelledby={`controller-${controller}`}>
              <div className="mb-3 flex items-center gap-2.5 px-1 text-slate-700 dark:text-slate-200">
                <Folder className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h2 id={`controller-${controller}`} className="text-base font-bold">
                  {controller}
                </h2>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {controllerEndpoints.length}{' '}
                  {controllerEndpoints.length === 1 ? 'endpoint' : 'endpoints'}
                </span>
              </div>
              <div className="space-y-2">
                {controllerEndpoints.map((endpoint) => {
                  const expanded = expandedEndpointIds.includes(endpoint.id)
                  const compared = comparisonEndpointIds.includes(endpoint.id)
                  const methodStyle = methodContainerStyles[endpoint.method]
                  const endpointDescription =
                    plainText(endpoint.description) ||
                    plainText(endpoint.summary) ||
                    'Sin descripción.'
                  const endpointElementId = getEndpointElementId(endpoint.id)
                  const detailsId = `${endpointElementId}-details`

                  return (
                    <div
                      id={endpointElementId}
                      key={endpoint.id}
                      className={`scroll-mt-16 overflow-hidden rounded-xl border transition-colors ${expanded ? methodStyle.expanded : methodStyle.collapsed}`}
                    >
                      <div
                        className={`group flex items-center gap-2 transition ${expanded ? methodStyle.expandedHeader : methodStyle.header}`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleDetails(endpoint.id)}
                          className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${methodStyle.focus}`}
                          aria-expanded={expanded}
                          aria-controls={detailsId}
                          aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${endpoint.summary}`}
                        >
                          <MethodBadge method={endpoint.method} strong />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <code className="truncate font-mono text-sm font-bold text-slate-900 dark:text-white">
                                {endpoint.path}
                              </code>
                              {endpoint.deprecated && (
                                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                                  Deprecado
                                </span>
                              )}
                            </span>
                            <span
                              className="mt-1 block truncate text-xs text-slate-600 dark:text-slate-400"
                              title={endpointDescription}
                            >
                              {endpointDescription}
                            </span>
                          </span>
                          <ChevronRight
                            className={`shrink-0 transition-transform ${methodStyle.indicator} ${expanded ? 'rotate-90' : ''}`}
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
                        <div id={detailsId} className={`border-t ${methodStyle.details}`}>
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
