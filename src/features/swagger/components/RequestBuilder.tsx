import { useMutation } from '@tanstack/react-query'
import { Copy, Eraser, KeyRound, LoaderCircle, Play, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { JsonEditor } from '../../../components/JsonEditor'
import { API_TOKEN_OPERATION_ENDPOINT } from '../../../services/auth/token.constants'
import { executeEndpoint, type ParameterValues } from '../../../services/endpointService'
import type { EndpointExecutionRecord, SwaggerEndpoint } from '../../../types/swagger'
import { getHttpStatusMessage, getRequestErrorMessage } from '../../../utils/httpErrors'
import { getSchemaType, isReferenceObject } from '../../../utils/openapi'
import { redactSensitiveData } from '../../../utils/redaction'
import { ExecutionErrorViewer, ResponseViewer } from './ResponseViewer'

function buildInitialParameters(endpoint: SwaggerEndpoint): ParameterValues {
  return Object.fromEntries(
    endpoint.parameters.map((parameter) => {
      const usesDefaultValue = ['page', 'pagesize'].includes(parameter.name.toLowerCase())
      const example = usesDefaultValue ? parameter.example : undefined
      const value =
        example === undefined ? '' : typeof example === 'string' ? example : JSON.stringify(example)
      return [`${parameter.location}:${parameter.name}`, value]
    }),
  )
}

interface RequestBuilderProps {
  endpoint: SwaggerEndpoint
  compact?: boolean
  initialExecution?: EndpointExecutionRecord
  onExecutionChange?: (execution?: EndpointExecutionRecord) => void
}

interface PendingExecution {
  timestamp: string
  startedAt: number
  request: unknown
}

export function RequestBuilder({
  endpoint,
  compact = false,
  initialExecution,
  onExecutionChange,
}: RequestBuilderProps) {
  const [parameters, setParameters] = useState<ParameterValues>(() =>
    buildInitialParameters(endpoint),
  )
  const [body, setBody] = useState('')
  const [lastExecution, setLastExecution] = useState(initialExecution)
  const [hasAttempted, setHasAttempted] = useState(false)
  const pendingExecution = useRef<PendingExecution>(undefined)

  const updateExecution = (record?: EndpointExecutionRecord) => {
    setLastExecution(record)
    onExecutionChange?.(record)
  }

  const execution = useMutation({
    mutationFn: executeEndpoint,
    onSuccess: (result) => {
      updateExecution({
        endpoint: {
          id: endpoint.id,
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary,
        },
        timestamp: result.timestamp,
        durationMs: result.durationMs,
        request: result.request,
        result,
      })
      if (result.status >= 200 && result.status < 300) toast.success('Solicitud completada')
      else toast.error(`${result.status}: ${getHttpStatusMessage(result.status)}`)
    },
    onError: (error) => {
      const message = getRequestErrorMessage(error, 'Endpoint')
      const pending = pendingExecution.current
      updateExecution({
        endpoint: {
          id: endpoint.id,
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary,
        },
        timestamp: pending?.timestamp ?? new Date().toISOString(),
        durationMs: pending ? Math.round(performance.now() - pending.startedAt) : 0,
        request: pending?.request ?? null,
        error: message,
      })
      toast.error(message)
    },
  })

  const run = () => {
    setHasAttempted(true)
    const missing = endpoint.parameters.find(
      (parameter) =>
        parameter.required && !parameters[`${parameter.location}:${parameter.name}`]?.trim(),
    )
    if (missing) {
      toast.error(`Completa el parámetro obligatorio “${missing.name}”.`)
      return
    }

    let parsedBody: unknown
    if (endpoint.requestBody) {
      if (!body.trim() && endpoint.requestBody.required) {
        toast.error('El request body es obligatorio.')
        return
      }
      if (body.trim()) {
        try {
          parsedBody = endpoint.requestBody.contentType.includes('json') ? JSON.parse(body) : body
        } catch {
          toast.error('Corrige el JSON antes de ejecutar la solicitud.')
          return
        }
      }
    }

    pendingExecution.current = {
      timestamp: new Date().toISOString(),
      startedAt: performance.now(),
      request: redactSensitiveData({
        parameters: Object.fromEntries(
          Object.entries(parameters).filter(([, value]) => value !== ''),
        ),
        body: parsedBody,
      }),
    }
    execution.mutate({ endpoint, parameters, body: parsedBody })
  }

  const clear = () => {
    setParameters(
      Object.fromEntries(endpoint.parameters.map((item) => [`${item.location}:${item.name}`, ''])),
    )
    setBody('')
    setHasAttempted(false)
    execution.reset()
    pendingExecution.current = undefined
    updateExecution(undefined)
  }

  const copyBody = async () => {
    await navigator.clipboard.writeText(body)
    toast.success('JSON copiado al portapapeles')
  }

  if (endpoint.path === API_TOKEN_OPERATION_ENDPOINT) {
    return (
      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
          <KeyRound size={20} />
        </div>
        <h2 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
          Token gestionado automáticamente
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
          Esta operación está reservada para el cliente HTTP interno. La aplicación solicita,
          renueva y utiliza el token sin exponer credenciales ni valores sensibles en pantalla.
        </p>
      </section>
    )
  }

  return (
    <div>
      <section
        className={`overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.04] to-white shadow-sm dark:to-white/[0.02] ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <Send size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Consola de pruebas
              </h2>
              <p className={`text-xs text-slate-500 ${compact ? 'hidden sm:block' : ''}`}>
                Los valores se envían directamente a la API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {endpoint.requestBody && (
              <button
                type="button"
                onClick={() => void copyBody()}
                disabled={execution.isPending}
                className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 sm:inline-flex dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Copy size={14} /> Copiar JSON
              </button>
            )}
            <button
              type="button"
              onClick={clear}
              disabled={execution.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Eraser size={14} /> Limpiar
            </button>
            <button
              type="button"
              onClick={run}
              disabled={execution.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60"
            >
              {execution.isPending ? (
                <LoaderCircle className="animate-spin" size={14} />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              {execution.isPending ? 'Ejecutando…' : 'Ejecutar'}
            </button>
          </div>
        </div>

        <div className={`space-y-5 ${compact ? 'p-4' : 'p-5'}`}>
          {endpoint.parameters.length > 0 && (
            <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
              {endpoint.parameters.map((parameter) => {
                const key = `${parameter.location}:${parameter.name}`
                const schema = parameter.schema
                const schemaType = schema && !isReferenceObject(schema) ? schema.type : undefined
                const enumOptions =
                  schema && !isReferenceObject(schema) && Array.isArray(schema.enum)
                    ? (schema.enum as unknown[]).map((value) => String(value))
                    : undefined
                const options =
                  enumOptions ?? (schemaType === 'boolean' ? ['true', 'false'] : undefined)
                const invalid = hasAttempted && parameter.required && !parameters[key]?.trim()
                return (
                  <label key={key} className="block">
                    <span
                      className={`mb-2 flex items-center justify-between text-xs font-medium transition-colors ${
                        invalid
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>
                        {parameter.name}
                        {parameter.required && (
                          <span className={`ml-1 ${invalid ? 'text-rose-500' : 'text-rose-400/60'}`}>*</span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {parameter.location} · {getSchemaType(parameter.schema)}
                      </span>
                    </span>
                    {options ? (
                      <select
                        value={parameters[key] ?? ''}
                        onChange={(event) =>
                          setParameters((current) => ({ ...current, [key]: event.target.value }))
                        }
                        required={parameter.required}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition outline-none dark:bg-[#0a1421] dark:text-white ${
                          invalid
                            ? 'border-rose-400 ring-2 ring-rose-400/20 dark:border-rose-500'
                            : 'border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-white/10'
                        }`}
                      >
                        <option value="">Seleccionar…</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          schemaType === 'integer' || schemaType === 'number'
                            ? 'number'
                            : schema && !isReferenceObject(schema) && schema.format === 'date'
                              ? 'date'
                              : 'text'
                        }
                        value={parameters[key] ?? ''}
                        onChange={(event) =>
                          setParameters((current) => ({ ...current, [key]: event.target.value }))
                        }
                        required={parameter.required}
                        placeholder={parameter.description ?? `Valor de ${parameter.name}`}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 dark:bg-black/20 dark:text-white ${
                          invalid
                            ? 'border-rose-400 ring-2 ring-rose-400/20 dark:border-rose-500'
                            : 'border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-white/10'
                        }`}
                      />
                    )}
                  </label>
                )
              })}
            </div>
          )}

          {endpoint.requestBody && (
            <JsonEditor value={body} onChange={setBody} label={endpoint.requestBody.contentType} />
          )}

          {!endpoint.parameters.length && !endpoint.requestBody && (
            <p className="rounded-xl border border-dashed border-slate-300 py-7 text-center text-sm text-slate-500 dark:border-white/10">
              Esta operación no requiere datos de entrada. Está lista para ejecutar.
            </p>
          )}
        </div>
      </section>

      {lastExecution?.result && <ResponseViewer result={lastExecution.result} compact={compact} />}
      {lastExecution?.error && <ExecutionErrorViewer record={lastExecution} compact={compact} />}
    </div>
  )
}
