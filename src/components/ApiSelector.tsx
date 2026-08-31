import { ChevronDown, Server } from 'lucide-react'
import { getActiveApi, getAvailableApis } from '../config/env'
import { useApiSelectionStore } from '../store/apiSelectionStore'

export function ApiSelector() {
  const activeApiId = useApiSelectionStore((state) => state.activeApiId)
  const selectApi = useApiSelectionStore((state) => state.selectApi)
  const activeApi = getActiveApi()

  return (
    <label className="mx-auto hidden max-w-xl min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex dark:border-white/10 dark:bg-black/20">
      <Server className="shrink-0 text-slate-400" size={14} />
      <span className="shrink-0 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        API
      </span>
      <select
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
  )
}
