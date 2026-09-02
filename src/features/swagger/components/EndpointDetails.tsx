import { ChevronDown, X } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { JsonViewer } from '../../../components/JsonViewer'
import { MethodBadge } from '../../../components/MethodBadge'
import { SchemaViewer } from '../../../components/SchemaViewer'
import type { SwaggerEndpoint } from '../../../types/swagger'
import {
  getSchemaType,
  isReferenceObject,
  plainText,
  resolveReference,
} from '../../../utils/openapi'
import { EndpointResponses } from './EndpointResponses'
import { RequestBuilder } from './RequestBuilder'

interface EndpointDetailsProps {
  endpoint: SwaggerEndpoint
  document: OpenAPIV3.Document
  onClose: () => void
}

export function EndpointDetails({ endpoint, document, onClose }: EndpointDetailsProps) {
  const bodyFields = endpoint.requestBody
    ? getBodyFields(endpoint.requestBody.schema, document)
    : []

  return (
    <article className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <header className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.025]">
          <div className="flex items-start gap-3">
            <MethodBadge method={endpoint.method} />
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="min-w-0 font-mono text-base font-bold break-all text-slate-900 sm:text-lg dark:text-white">
                  {endpoint.path}
                </h1>
                {endpoint.deprecated && (
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                    Deprecado
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {plainText(endpoint.summary) || 'Sin resumen adicional.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Cerrar detalle del endpoint"
              title="Cerrar detalle"
            >
              <span className="hidden text-xs font-semibold sm:inline">Cerrar</span>
              <X size={17} />
            </button>
          </div>
        </header>
        <details className="group/summary overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.025]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Resumen del endpoint
            </span>
            <ChevronDown
              className="shrink-0 text-slate-400 transition-transform group-open/summary:rotate-180"
              size={17}
            />
          </summary>
          <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
            <p className="max-w-4xl text-sm leading-6 whitespace-pre-line text-slate-600 dark:text-slate-400">
              {plainText(endpoint.description) || 'Sin descripción adicional.'}
            </p>
          </div>
        </details>
      </div>

      {endpoint.requestBody && (
        <Section
          title="Request body"
          eyebrow={endpoint.requestBody.required ? 'Obligatorio' : 'Opcional'}
        >
          {endpoint.requestBody.description && (
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              {plainText(endpoint.requestBody.description)}
            </p>
          )}
          {bodyFields.length > 0 && (
            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <BodyFieldGroup
                label="Campos obligatorios"
                fields={bodyFields.filter((field) => field.required)}
                required
              />
              <BodyFieldGroup
                label="Campos opcionales"
                fields={bodyFields.filter((field) => !field.required)}
              />
            </div>
          )}
          <div className="grid gap-5 xl:grid-cols-2">
            <SchemaViewer
              schema={endpoint.requestBody.schema}
              document={document}
              label="Esquema JSON"
            />
            <JsonViewer value={endpoint.requestBody.example} label="Ejemplo de request" />
          </div>
        </Section>
      )}

      <RequestBuilder endpoint={endpoint} />

      <EndpointResponses endpoint={endpoint} document={document} />
    </article>
  )
}

interface BodyField {
  name: string
  type: string
  required: boolean
}

function getBodyFields(
  schemaOrReference: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
  document: OpenAPIV3.Document,
): BodyField[] {
  if (!schemaOrReference) return []
  const schema = isReferenceObject(schemaOrReference)
    ? resolveReference<OpenAPIV3.SchemaObject>(document, schemaOrReference.$ref)
    : schemaOrReference
  if (!schema) return []

  const ownFields = Object.entries(schema.properties ?? {}).map(([name, property]) => ({
    name,
    type: getSchemaType(property),
    required: schema.required?.includes(name) ?? false,
  }))
  const inheritedFields = (schema.allOf ?? []).flatMap((part) => getBodyFields(part, document))
  return [
    ...new Map([...inheritedFields, ...ownFields].map((field) => [field.name, field])).values(),
  ]
}

function BodyFieldGroup({
  label,
  fields,
  required = false,
}: {
  label: string
  fields: BodyField[]
  required?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
      <p
        className={`text-[10px] font-semibold tracking-[0.12em] uppercase ${required ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400'}`}
      >
        {label} · {fields.length}
      </p>
      {fields.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {fields.map((field) => (
            <span
              key={field.name}
              title={field.type}
              className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300"
            >
              {field.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Ninguno</p>
      )}
    </div>
  )
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-9">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <span className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {eyebrow}
        </span>
      </div>
      {children}
    </section>
  )
}
