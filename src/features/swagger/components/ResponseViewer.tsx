import { CheckCircle2, Copy, Download, WifiOff, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { JsonViewer } from '../../../components/JsonViewer'
import type { EndpointExecutionRecord, EndpointExecutionResult } from '../../../types/swagger'
import { getHttpStatusMessage, extractApiErrorMessage } from '../../../utils/httpErrors'

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

export function ResponseViewer({
  result,
  compact = false,
}: {
  result: EndpointExecutionResult
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const successful = result.status >= 200 && result.status < 300
  const downloadUrl = useMemo(
    () => (result.download ? URL.createObjectURL(result.download.blob) : undefined),
    [result.download],
  )

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

  const copyResponse = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2) ?? '')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section
      className={`mt-6 overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.025] ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
      >
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
        {result.download && downloadUrl ? (
          <a
            href={downloadUrl}
            download={result.download.filename}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-400"
          >
            <Download size={14} /> Descargar archivo
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void copyResponse()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Copy size={14} /> {copied ? 'Copiado' : 'Copiar JSON'}
          </button>
        )}
      </div>

      {!successful && (
        <div
          role="alert"
          className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-800 dark:text-amber-200"
        >
          {extractApiErrorMessage(result.data) ?? getHttpStatusMessage(result.status)}
        </div>
      )}

      <div className={`space-y-5 ${compact ? 'p-4' : 'p-5'}`}>
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
            URL ejecutada
          </p>
          <code className="block overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-black/20 dark:text-slate-300">
            {result.url}
          </code>
        </div>
        <div className={`grid gap-2 ${compact ? '' : 'xl:grid-cols-2'}`}>
          <JsonViewer value={result.request} label="Request enviada" collapsed />
          <JsonViewer value={result.headers} label="Headers de respuesta" collapsed />
        </div>
        {result.download ? (
          <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
            <div className="flex items-center gap-3 px-4 py-4">
              <Download className="text-emerald-600 dark:text-emerald-300" size={20} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {result.download.filename}
                </p>
                <p className="text-xs text-slate-500">{result.download.contentType}</p>
              </div>
            </div>
            <ExecutionFooter
              status={`${result.status} ${result.statusText}`}
              statusTone={successful ? 'success' : 'danger'}
              durationMs={result.durationMs}
              method={result.method}
              timestamp={result.timestamp}
            />
          </div>
        ) : (
          <JsonViewer
            value={result.data}
            label="Response body"
            maxHeight="max-h-[34rem]"
            collapsible
            collapsibleNodes
            footer={
              <ExecutionFooter
                status={`${result.status} ${result.statusText}`}
                statusTone={successful ? 'success' : 'danger'}
                durationMs={result.durationMs}
                method={result.method}
                timestamp={result.timestamp}
              />
            }
          />
        )}
      </div>
    </section>
  )
}

export function ExecutionErrorViewer({
  record,
  compact = false,
}: {
  record: EndpointExecutionRecord
  compact?: boolean
}) {
  return (
    <section
      className={`mt-6 overflow-hidden border border-rose-500/20 bg-white shadow-sm dark:bg-white/[0.025] ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
    >
      <div
        className={`flex items-center gap-3 border-b border-rose-500/20 bg-rose-500/[0.06] ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
      >
        <WifiOff className="shrink-0 text-rose-500" size={20} />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Error de ejecución</p>
          <p className="text-xs text-slate-500">La API no entregó una respuesta HTTP utilizable</p>
        </div>
      </div>

      <div
        role="alert"
        className="border-b border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm text-rose-700 dark:text-rose-300"
      >
        {record.error}
      </div>
      <div className={`space-y-2 ${compact ? 'p-4' : 'p-5'}`}>
        <JsonViewer value={record.request} label="Request enviada" collapsed />
        <JsonViewer
          value={{ error: record.error }}
          label="Response body"
          collapsible
          collapsibleNodes
          footer={
            <ExecutionFooter
              status="Sin respuesta"
              statusTone="danger"
              durationMs={record.durationMs}
              method={record.endpoint.method.toUpperCase()}
              timestamp={record.timestamp}
            />
          }
        />
      </div>
    </section>
  )
}

function ExecutionFooter({
  status,
  statusTone,
  durationMs,
  method,
  timestamp,
}: {
  status: string
  statusTone: 'success' | 'danger'
  durationMs: number
  method: string
  timestamp: string
}) {
  return (
    <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
      <FooterMetric label="Estado HTTP" value={status} tone={statusTone} />
      <FooterMetric label="Tiempo" value={`${durationMs} ms`} />
      <FooterMetric label="Método" value={method} />
      <FooterMetric label="Ejecutado" value={formatTimestamp(timestamp)} />
    </div>
  )
}

function FooterMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success' | 'danger'
}) {
  return (
    <div className="min-w-0 bg-slate-950 px-3 py-1.5">
      <p className="text-[8px] font-bold tracking-[0.1em] text-slate-500 uppercase">{label}</p>
      <p
        className={`truncate text-[10px] leading-4 font-semibold ${tone === 'success' ? 'text-emerald-400' : tone === 'danger' ? 'text-rose-400' : 'text-slate-300'}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}
