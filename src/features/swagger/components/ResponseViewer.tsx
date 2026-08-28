import { CheckCircle2, Clock3, Copy, Globe2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { JsonViewer } from '../../../components/JsonViewer'
import type { EndpointExecutionResult } from '../../../types/swagger'
import { getHttpStatusMessage } from '../../../utils/httpErrors'

export function ResponseViewer({ result }: { result: EndpointExecutionResult }) {
  const [copied, setCopied] = useState(false)
  const successful = result.status >= 200 && result.status < 300

  const copyResponse = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.025]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          {successful ? (
            <CheckCircle2 className="text-emerald-500" size={20} />
          ) : (
            <XCircle className="text-rose-500" size={20} />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Resultado</p>
            <p className="text-xs text-slate-500">Respuesta recibida desde la API</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void copyResponse()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Copy size={14} /> {copied ? 'Copiado' : 'Copiar JSON'}
        </button>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-white/10">
        <Metric
          label="Estado HTTP"
          value={`${result.status} ${result.statusText}`}
          tone={successful ? 'success' : 'danger'}
        />
        <Metric label="Tiempo" value={`${result.durationMs} ms`} icon={<Clock3 size={14} />} />
        <Metric label="Método" value={result.method} icon={<Globe2 size={14} />} />
      </div>

      {!successful && (
        <div
          role="alert"
          className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-800 dark:text-amber-200"
        >
          {getHttpStatusMessage(result.status)}
        </div>
      )}

      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
            URL ejecutada
          </p>
          <code className="block overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-black/20 dark:text-slate-300">
            {result.url}
          </code>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <JsonViewer value={result.request} label="Request enviada" />
          <JsonViewer value={result.headers} label="Headers de respuesta" />
        </div>
        <JsonViewer value={result.data} label="Response body" maxHeight="max-h-[34rem]" />
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'success' | 'danger'
}) {
  return (
    <div className="bg-white px-5 py-3 dark:bg-[#0c1726]">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}
      >
        {icon} {value}
      </p>
    </div>
  )
}
