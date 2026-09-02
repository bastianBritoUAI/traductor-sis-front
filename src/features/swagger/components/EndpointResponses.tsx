import { ChevronDown } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { JsonViewer } from '../../../components/JsonViewer'
import { SchemaViewer } from '../../../components/SchemaViewer'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { plainText } from '../../../utils/openapi'

interface EndpointResponsesProps {
  endpoint: SwaggerEndpoint
  document: OpenAPIV3.Document
  compact?: boolean
}

export function EndpointResponses({ endpoint, document, compact = false }: EndpointResponsesProps) {
  return (
    <details className={`group/responses ${compact ? 'mt-6' : 'mt-9'}`} open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 marker:hidden">
        <h2
          className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-900 dark:text-white`}
        >
          Respuestas
        </h2>
        <span className="ml-auto text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {endpoint.responses.length} definidas
        </span>
        <ChevronDown
          className="shrink-0 text-slate-400 transition-transform group-open/responses:rotate-180"
          size={compact ? 16 : 18}
        />
      </summary>
      <div className={`${compact ? 'mt-3' : 'mt-4'} space-y-3`}>
        {endpoint.responses.map((response) => {
          const successful = response.status.startsWith('2')
          return (
            <details
              key={`${endpoint.id}-${response.status}`}
              className="group/response overflow-hidden rounded-lg border border-slate-200 bg-white open:shadow-sm dark:border-white/10 dark:bg-white/[0.025]"
            >
              <summary
                className={`flex cursor-pointer list-none items-center gap-3 marker:hidden ${compact ? 'px-3 py-3' : 'px-4 py-3.5'}`}
              >
                <span
                  className={`inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ${successful ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
                >
                  {response.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                  {plainText(response.description)}
                </span>
                <span className={`${compact ? 'hidden sm:inline' : ''} text-xs text-slate-400`}>
                  {response.contentType ?? 'Sin contenido'}
                </span>
                <ChevronDown
                  className="shrink-0 text-slate-400 transition-transform group-open/response:rotate-180"
                  size={16}
                />
              </summary>
              <div
                className={`grid items-stretch gap-4 border-t border-slate-200 p-4 dark:border-white/10 ${compact ? '' : 'xl:grid-cols-2'}`}
              >
                <SchemaViewer
                  schema={response.schema}
                  document={document}
                  label="Modelo esperado"
                />
                <JsonViewer value={response.example} label="Ejemplo JSON" fillHeight />
              </div>
            </details>
          )
        })}
      </div>
    </details>
  )
}
