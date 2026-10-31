import { ChevronDown, ExternalLink, Server } from 'lucide-react'
import { getActiveApi, getAvailableApis } from '../config/env'
import { useApiSelectionStore } from '../store/apiSelectionStore'

export function ApiSelector() {
  const activeApiId = useApiSelectionStore((state) => state.activeApiId)
  const selectApi = useApiSelectionStore((state) => state.selectApi)
  const activeApi = getActiveApi()
  const swaggerUiUrl = new URL('/swagger/index.html', activeApi.openApiUrl).toString()

  return (
    <div className="mx-auto hidden max-w-xl min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex dark:border-white/10 dark:bg-black/20">
      <label htmlFor="api-selector" className="flex min-w-0 flex-1 items-center gap-2">
        <Server className="shrink-0 text-slate-400" size={14} />
        <span className="shrink-0 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          API
        </span>
        <select
          id="api-selector"
          value={activeApiId ?? activeApi.id}
          onChange={(event) => selectApi(event.target.value as typeof activeApi.id)}
          className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 font-mono text-[11px] text-slate-600 outline-none dark:text-slate-300"
          aria-label="Seleccionar API"
        >
          {getAvailableApis().map((api) => (
            <option key={api.id} value={api.id}>
              {api.name} — {api.baseUrl}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none -ml-5 shrink-0 text-slate-400" size={14} />
      </label>
      <a
        href={swaggerUiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label={`Abrir Swagger de ${activeApi.name} en otra pestaña`}
        title={`Abrir Swagger de ${activeApi.name}`}
      >
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  )
}
