import {
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { MethodBadge } from '../../../components/MethodBadge'
import { useUiStore } from '../../../store/uiStore'
import type { HttpMethod, SwaggerEndpoint } from '../../../types/swagger'

// Clases pre-calculadas por método para evitar purga de Tailwind con strings dinámicos
const methodSelectedStyle: Record<HttpMethod, string> = {
  get: 'border-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20',
  post: 'border-orange-400 bg-orange-500/10 dark:bg-orange-500/20',
  put: 'border-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
  patch: 'border-violet-400 bg-violet-500/10 dark:bg-violet-500/20',
  delete: 'border-rose-400 bg-rose-500/10 dark:bg-rose-500/20',
  options: 'border-slate-400 bg-slate-500/10 dark:bg-slate-500/20',
  head: 'border-slate-400 bg-slate-500/10 dark:bg-slate-500/20',
}

interface SidebarSwaggerProps {
  endpoints: SwaggerEndpoint[]
  apiTitle: string
  apiVersion: string
  desktop?: boolean
}

// const methods: Array<HttpMethod | 'all'> = ['all', 'get', 'post', 'put', 'patch', 'delete']

export function SidebarSwagger({
  endpoints,
  apiTitle,
  apiVersion,
  desktop = false,
}: SidebarSwaggerProps) {
  const [search, setSearch] = useState('')
  // const [method, setMethod] = useState<HttpMethod | 'all'>('all')
  const [groupVisibility, setGroupVisibility] = useState<Record<string, boolean>>({})
  const selectedEndpointId = useUiStore((state) => state.selectedEndpointId)
  const selectEndpoint = useUiStore((state) => state.selectEndpoint)
  const comparisonEndpointIds = useUiStore((state) => state.comparisonEndpointIds)
  const toggleComparisonEndpoint = useUiStore((state) => state.toggleComparisonEndpoint)
  // const setExplorerView = useUiStore((state) => state.setExplorerView)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed)

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    const filtered = endpoints.filter((endpoint) => {
      const matchesMethod = true
      const searchable =
        `${endpoint.summary} ${endpoint.path} ${endpoint.tags.join(' ')}`.toLocaleLowerCase('es')
      return matchesMethod && (!term || searchable.includes(term))
    })

    return Object.entries(
      filtered.reduce<Record<string, SwaggerEndpoint[]>>((groups, endpoint) => {
        const tag = endpoint.tags[0] ?? 'General'
        groups[tag] = [...(groups[tag] ?? []), endpoint]
        return groups
      }, {}),
    )
  }, [endpoints, search])

  const isExpanded = (tag: string, index: number) =>
    search.length > 0 || (groupVisibility[tag] ?? index < 2)
  const toggleGroup = (tag: string, open: boolean) =>
    setGroupVisibility((current) => ({ ...current, [tag]: !open }))

  const allExpanded = filteredGroups.every(([tag], index) => isExpanded(tag, index))
  const toggleAllGroups = () => {
    const next = !allExpanded
    setGroupVisibility(Object.fromEntries(filteredGroups.map(([tag]) => [tag, next])))
  }

  if (desktop && sidebarCollapsed) {
    return (
      <aside className="flex h-full w-14 flex-col items-center border-r border-slate-200 bg-white py-3 transition-[width] duration-200 dark:border-white/[0.08] dark:bg-[#070e1a]">
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300"
          aria-label="Expandir menú de endpoints"
          title="Expandir menú de endpoints"
        >
          <PanelLeftOpen size={19} />
        </button>
        <span className="mt-5 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase [writing-mode:vertical-rl]">
          Endpoints
        </span>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-[360px] max-w-[90vw] flex-col border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-white/[0.08] dark:bg-[#070e1a]">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-white/[0.08]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="truncate text-sm font-bold text-slate-900 dark:text-white"
              title={apiTitle}
            >
              {apiTitle}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {apiVersion} · {endpoints.length} operaciones
            </p>
          </div>
          {desktop ? (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
              aria-label="Colapsar menú de endpoints"
              title="Colapsar menú de endpoints"
            >
              <PanelLeftClose size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Cerrar navegación"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={15}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar ruta u operación…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-xs text-slate-900 transition outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500/60 dark:focus:bg-white/[0.09]"
          />
        </label>
        {/* <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <SlidersHorizontal className="mr-1 shrink-0 text-slate-400" size={14} />
          {methods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMethod(item)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-wide uppercase transition ${method === item ? 'bg-slate-900 text-white dark:bg-cyan-400 dark:text-slate-950' : 'bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {item === 'all' ? 'Todos' : item}
            </button>
          ))}
        </div> */}
        {/* <button
          type="button"
          onClick={() => setExplorerView('compare')}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.07] px-3 py-2.5 text-left text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/10 dark:text-cyan-300"
        >
          <Columns3 size={16} />
          <span className="flex-1">Abrir comparador</span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold">
            {comparisonEndpointIds.length}
          </span>
        </button>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          Usa el botón + de cada operación para agregarla a la comparación.
        </p> */}
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label="Endpoints OpenAPI">
        {filteredGroups.length > 0 && (
          <div className="flex items-center justify-end border-b border-slate-100 px-3 py-1.5 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={toggleAllGroups}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            >
              {allExpanded ? <ChevronsDownUp size={11} /> : <ChevronsUpDown size={11} />}
              {allExpanded ? 'Colapsar todo' : 'Expandir todo'}
            </button>
          </div>
        )}
        <div className="px-2 py-3">
          {filteredGroups.length ? (
            filteredGroups.map(([tag, group], index) => {
              const open = isExpanded(tag, index)
              return (
                <div key={tag} className={index > 0 ? 'mt-3' : ''}>
                  {/* group header — estilo label de sección */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(tag, open)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                    aria-expanded={open}
                  >
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-slate-400 transition dark:text-slate-500 ${open ? '' : '-rotate-90'}`}
                    />
                    <span className="flex-1 truncate text-[11px] font-semibold tracking-wide text-slate-700 dark:text-slate-200">
                      {tag}
                    </span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 tabular-nums dark:bg-white/10 dark:text-slate-400">
                      {group.length}
                    </span>
                  </button>

                  {open && (
                    <div className="mt-0.5 space-y-px">
                      {group.map((endpoint) => {
                        const compared = comparisonEndpointIds.includes(endpoint.id)
                        const selected = selectedEndpointId === endpoint.id
                        return (
                          <div
                            key={endpoint.id}
                            className={`group/endpoint flex items-center overflow-hidden rounded-r-lg border-l-[3px] transition-colors ${
                              selected
                                ? methodSelectedStyle[endpoint.method]
                                : 'border-transparent hover:border-slate-300 hover:bg-slate-50 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.07]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => selectEndpoint(endpoint.id)}
                              className="flex min-w-0 flex-1 items-start gap-2.5 px-2 py-2 text-left"
                            >
                              <MethodBadge method={endpoint.method} compact />
                              <span className="min-w-0">
                                <span
                                  className={`line-clamp-2 block text-[11px] leading-[1.35] font-medium ${
                                    selected
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {endpoint.summary}
                                  {endpoint.deprecated && (
                                    <span className="ml-1.5 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] leading-3 font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                                      Deprecado
                                    </span>
                                  )}
                                </span>
                                <code className="mt-0.5 block truncate text-[10px] text-slate-400 dark:text-slate-500">
                                  {endpoint.path}
                                </code>
                              </span>
                            </button>

                            {/* botón de comparador — visible solo en hover o cuando está activo */}
                            <button
                              type="button"
                              onClick={() => toggleComparisonEndpoint(endpoint.id)}
                              className={`mr-1.5 shrink-0 rounded-md p-1.5 transition ${
                                compared
                                  ? 'bg-violet-500 text-white'
                                  : 'text-slate-400 opacity-0 group-hover/endpoint:opacity-100 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300'
                              }`}
                              aria-pressed={compared}
                              aria-label={`${compared ? 'Quitar' : 'Agregar'} ${endpoint.summary} ${compared ? 'del' : 'al'} comparador`}
                              title={compared ? 'Quitar del comparador' : 'Agregar al comparador'}
                            >
                              {compared ? <Check size={13} /> : <Plus size={13} />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="px-5 py-12 text-center">
              <ChevronsUpDown
                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                size={28}
              />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Sin coincidencias
              </p>
              <p className="mt-1 text-xs text-slate-400">Prueba con otro término o método.</p>
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
