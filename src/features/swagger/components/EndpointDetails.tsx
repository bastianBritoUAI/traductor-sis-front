import { ChevronDown, Link2 } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { JsonViewer } from '../../../components/JsonViewer'
import { getEnvironment } from '../../../config/env'
import type { SwaggerEndpoint } from '../../../types/swagger'
import {
  describeSchema,
  getSchemaType,
  isReferenceObject,
  plainText,
  resolveReference,
} from '../../../utils/openapi'
import { RequestBuilder } from './RequestBuilder'

interface EndpointDetailsProps {
  endpoint: SwaggerEndpoint
  document: OpenAPIV3.Document
}

export function EndpointDetails({ endpoint, document }: EndpointDetailsProps) {
  const fullUrl = `${getEnvironment().apiBaseUrl}${endpoint.path}`
  const bodyFields = endpoint.requestBody
    ? getBodyFields(endpoint.requestBody.schema, document)
    : []

  return (
    <article className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {endpoint.tags[0]}
          </span>
          {endpoint.deprecated && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
              Obsoleto
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          {endpoint.summary}
        </h1>
        <details
          className="group/summary mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.025]"
          open
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
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
        <div className="mt-3 flex items-center gap-3 overflow-x-auto rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]">
          <Link2 className="shrink-0 text-slate-400" size={16} />
          <code className="text-xs text-slate-700 dark:text-slate-300">{fullUrl}</code>
        </div>
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
            <JsonViewer
              value={describeSchema(endpoint.requestBody.schema, document)}
              label="Esquema JSON"
            />
            <JsonViewer value={endpoint.requestBody.example} label="Ejemplo de request" />
          </div>
        </Section>
      )}

      <details key={endpoint.id} className="group/responses mb-9">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 marker:hidden">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Respuestas</h2>
          <span className="ml-auto text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {endpoint.responses.length} definidas
          </span>
          <ChevronDown
            className="shrink-0 text-slate-400 transition-transform group-open/responses:rotate-180"
            size={18}
          />
        </summary>
        <div className="mt-4 space-y-3">
          {endpoint.responses.map((response) => {
            const successful = response.status.startsWith('2')
            return (
              <details
                key={`${endpoint.id}-${response.status}`}
                className="group/response overflow-hidden rounded-lg border border-slate-200 bg-white open:shadow-sm dark:border-white/10 dark:bg-white/[0.025]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 marker:hidden">
                  <span
                    className={`inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ${successful ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
                  >
                    {response.status}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                    {plainText(response.description)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {response.contentType ?? 'Sin contenido'}
                  </span>
                  <ChevronDown
                    className="shrink-0 text-slate-400 transition-transform group-open/response:rotate-180"
                    size={16}
                  />
                </summary>
                <div className="grid gap-4 border-t border-slate-200 p-4 xl:grid-cols-2 dark:border-white/10">
                  <JsonViewer
                    value={describeSchema(response.schema, document)}
                    label="Modelo esperado"
                  />
                  <JsonViewer value={response.example} label="Ejemplo JSON" />
                </div>
              </details>
            )
          })}
        </div>
      </details>

      <RequestBuilder key={endpoint.id} endpoint={endpoint} />
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
