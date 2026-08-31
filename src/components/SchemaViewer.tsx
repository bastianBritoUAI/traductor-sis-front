import { ChevronDown, ChevronRight } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { useState } from 'react'
import { isReferenceObject, plainText, resolveReference } from '../utils/openapi'

export interface SchemaViewerProps {
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  document: OpenAPIV3.Document
  label?: string
}

const TYPE_STYLES: Record<DataTypeCategory, string> = {
  string: 'bg-emerald-400/10 text-emerald-300',
  numeric: 'bg-blue-400/10 text-blue-300',
  date: 'bg-cyan-400/10 text-cyan-300',
  other: 'bg-orange-400/10 text-orange-300',
}

type DataTypeCategory = 'string' | 'numeric' | 'date' | 'other'

function resolveSchemaRef(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): { schema: OpenAPIV3.SchemaObject; modelName?: string } | null {
  if (!isReferenceObject(schemaOrRef)) return { schema: schemaOrRef }

  const schema = resolveReference<OpenAPIV3.SchemaObject>(document, schemaOrRef.$ref)
  if (!schema) return null

  return { schema, modelName: schemaOrRef.$ref.split('/').at(-1) }
}

function mergeAllOf(
  parts: Array<OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>,
  document: OpenAPIV3.Document,
  visited: Set<string> = new Set(),
): OpenAPIV3.SchemaObject {
  const merged: OpenAPIV3.SchemaObject = { type: 'object', properties: {}, required: [] }

  for (const part of parts) {
    const reference = isReferenceObject(part) ? part.$ref : undefined
    if (reference && visited.has(reference)) continue

    const schema = isReferenceObject(part)
      ? resolveReference<OpenAPIV3.SchemaObject>(document, part.$ref)
      : part
    if (!schema) continue

    const nextVisited = reference ? new Set([...visited, reference]) : visited
    const effective = schema.allOf ? mergeAllOf(schema.allOf, document, nextVisited) : schema

    Object.assign(merged.properties!, effective.properties ?? {})
    merged.required = [...new Set([...(merged.required ?? []), ...(effective.required ?? [])])]
  }

  return merged
}

function getEffectiveSchema(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): OpenAPIV3.SchemaObject | undefined {
  const resolved = resolveSchemaRef(schemaOrRef, document)
  if (!resolved) return undefined
  if (!resolved.schema.allOf) return resolved.schema

  return { ...resolved.schema, ...mergeAllOf(resolved.schema.allOf, document) }
}

function schemaType(schema: OpenAPIV3.SchemaObject | undefined): string {
  if (!schema) return 'object'
  if (schema.oneOf) return 'oneOf'
  if (schema.anyOf) return 'anyOf'
  return schema.type ?? 'object'
}

function typeLabel(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): string {
  const effective = getEffectiveSchema(schemaOrRef, document)

  if (isReferenceObject(schemaOrRef)) {
    const modelName = schemaOrRef.$ref.split('/').at(-1) ?? 'modelo'
    return `${schemaType(effective)}<${modelName}>`
  }

  if (schemaOrRef.type === 'array') {
    if (!schemaOrRef.items) return 'array'
    const itemName = isReferenceObject(schemaOrRef.items)
      ? (schemaOrRef.items.$ref.split('/').at(-1) ?? 'object')
      : schemaOrRef.items.type === 'array'
        ? 'array'
        : (schemaOrRef.items.type ?? 'object')
    return `array<${itemName}>`
  }
  if (schemaOrRef.oneOf) return `oneOf (${schemaOrRef.oneOf.length})`
  if (schemaOrRef.anyOf) return `anyOf (${schemaOrRef.anyOf.length})`
  if (schemaOrRef.allOf) return `object (${schemaOrRef.allOf.length} modelos)`

  const baseType = schemaOrRef.type ?? 'object'
  return schemaOrRef.format ? `${baseType} (${schemaOrRef.format})` : baseType
}

function typeStyle(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): string {
  return TYPE_STYLES[dataTypeCategory(getEffectiveSchema(schemaOrRef, document))]
}

function dataTypeCategory(schema: OpenAPIV3.SchemaObject | undefined): DataTypeCategory {
  const type = schema?.type?.toLowerCase() ?? ''
  const format = schema?.format?.toLowerCase() ?? ''

  if (/(date|time|timestamp)/.test(`${type} ${format}`)) return 'date'
  if (
    ['integer', 'number', 'int', 'long', 'float', 'double', 'decimal', 'numeric', 'short'].some(
      (numericType) => type === numericType || format.includes(numericType),
    )
  ) {
    return 'numeric'
  }
  if (type === 'string') return 'string'
  return 'other'
}

function expandableTarget(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined {
  const effective = getEffectiveSchema(schemaOrRef, document)
  return effective?.type === 'array' && effective.items ? effective.items : schemaOrRef
}

function isExpandable(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): boolean {
  const effective = getEffectiveSchema(schemaOrRef, document)
  if (!effective) return false
  if (Object.keys(effective.properties ?? {}).length > 0) return true
  if (effective.oneOf?.length || effective.anyOf?.length) return true

  if (effective.type === 'array' && effective.items) {
    const item = getEffectiveSchema(effective.items, document)
    return !!(
      Object.keys(item?.properties ?? {}).length ||
      item?.oneOf?.length ||
      item?.anyOf?.length ||
      (item?.type === 'array' && item.items)
    )
  }

  return false
}

interface SchemaNodesProps {
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  document: OpenAPIV3.Document
  depth: number
}

function SchemaNodes({ schemaOrRef, document, depth }: SchemaNodesProps) {
  const schema = getEffectiveSchema(schemaOrRef, document)
  if (!schema) return null

  const composition = schema.oneOf ?? schema.anyOf
  if (composition?.length) {
    const keyword = schema.oneOf ? 'oneOf' : 'anyOf'
    return (
      <>
        {composition.map((option, index) => (
          <CompositionNode
            key={`${keyword}-${index}`}
            label={`${keyword} · alternativa ${index + 1}`}
            schemaOrRef={option}
            document={document}
            depth={depth}
          />
        ))}
      </>
    )
  }

  const required = schema.required ?? []
  return (
    <>
      {Object.entries(schema.properties ?? {}).map(([name, property]) => (
        <PropertyNode
          key={name}
          name={name}
          required={required.includes(name)}
          schemaOrRef={property}
          document={document}
          depth={depth}
        />
      ))}
    </>
  )
}

interface CompositionNodeProps extends SchemaNodesProps {
  label: string
}

function CompositionNode({ label, schemaOrRef, document, depth }: CompositionNodeProps) {
  return (
    <div
      role="treeitem"
      className={`relative mb-1 min-w-[34rem] last:mb-0 ${
        depth > 0
          ? 'before:absolute before:top-5 before:-left-8 before:w-8 before:border-t before:border-slate-700/80'
          : ''
      }`}
    >
      <div className="rounded-lg bg-white/[0.02] px-3 py-2">
        <span className="font-mono text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <div role="group" className="ml-10 border-l border-slate-700/80 pt-1 pl-8">
        <SchemaNodes schemaOrRef={schemaOrRef} document={document} depth={depth + 1} />
      </div>
    </div>
  )
}

interface PropertyNodeProps extends SchemaNodesProps {
  name: string
  required: boolean
}

function PropertyNode({ name, required, schemaOrRef, document, depth }: PropertyNodeProps) {
  const [open, setOpen] = useState(depth < 1)
  const expandable = isExpandable(schemaOrRef, document)
  const effective = getEffectiveSchema(schemaOrRef, document)
  const target = expandableTarget(schemaOrRef, document)
  const description = effective?.description ? plainText(effective.description) : undefined
  const enumValues = effective?.enum as unknown[] | undefined

  return (
    <div
      role="treeitem"
      aria-expanded={expandable ? open : undefined}
      className={`relative mb-1 min-w-[34rem] last:mb-0 ${
        depth > 0
          ? 'before:absolute before:top-5 before:-left-8 before:w-8 before:border-t before:border-slate-700/80'
          : ''
      }`}
    >
      <div className="rounded-lg bg-white/[0.025] px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {expandable ? (
            <button
              type="button"
              aria-label={`${open ? 'Colapsar' : 'Expandir'} campo ${name}`}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="-ml-1 rounded p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
            >
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span aria-hidden="true" className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-600" />
          )}

          <span className="font-mono text-xs font-semibold text-slate-100">{name}</span>
          {required && (
            <span className="rounded bg-rose-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-300 uppercase">
              required
            </span>
          )}
          <span
            title="Tipo de dato"
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${typeStyle(schemaOrRef, document)}`}
          >
            {typeLabel(schemaOrRef, document)}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              effective?.nullable
                ? 'bg-teal-400/10 text-teal-300'
                : 'bg-slate-800/70 text-slate-400'
            }`}
          >
            {effective?.nullable ? 'Null' : 'Not Null'}
          </span>
        </div>

        <p
          className={`mt-1.5 text-xs leading-5 ${description ? 'text-slate-400' : 'text-slate-500 italic'}`}
        >
          <span className="font-medium text-slate-500 not-italic">Descripción: </span>
          {description ?? 'Sin descripción funcional.'}
        </p>
        {enumValues?.length ? (
          <p className="mt-1 text-[10px] text-slate-500">
            Valores permitidos: {enumValues.map(String).join(' | ')}
          </p>
        ) : null}
      </div>

      {expandable && open && target && (
        <div role="group" className="ml-10 border-l border-slate-700/80 pt-1 pl-8">
          <SchemaNodes schemaOrRef={target} document={document} depth={depth + 1} />
        </div>
      )}
    </div>
  )
}

function PrimitiveSchema({ schema }: { schema: OpenAPIV3.SchemaObject }) {
  const description = schema.description ? plainText(schema.description) : undefined

  return (
    <div className="p-3">
      <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TYPE_STYLES[dataTypeCategory(schema)]}`}
          >
            {schema.format
              ? `${schema.type ?? 'object'} (${schema.format})`
              : (schema.type ?? 'object')}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              schema.nullable ? 'bg-teal-400/10 text-teal-300' : 'bg-slate-800/70 text-slate-400'
            }`}
          >
            {schema.nullable ? 'Null' : 'Not Null'}
          </span>
        </div>
        <p
          className={`mt-1.5 text-xs leading-5 ${description ? 'text-slate-400' : 'text-slate-500 italic'}`}
        >
          <span className="font-medium text-slate-500 not-italic">Descripción: </span>
          {description ?? 'Sin descripción funcional.'}
        </p>
      </div>
    </div>
  )
}

export function SchemaViewer({ schema, document, label }: SchemaViewerProps) {
  const title = label ?? 'Modelo esperado'

  if (!schema) {
    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10">
        <header className="border-b border-white/10 px-4 py-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {title}
          </span>
        </header>
        <p className="px-4 py-4 text-xs text-slate-500 italic">Sin modelo definido</p>
      </section>
    )
  }

  const resolved = resolveSchemaRef(schema, document)
  const rootSchema = getEffectiveSchema(schema, document)
  const isArray = rootSchema?.type === 'array'
  const itemSchemaOrRef = isArray ? rootSchema?.items : undefined
  const hasComposition = !!(rootSchema?.oneOf?.length ?? rootSchema?.anyOf?.length)
  const hasProperties = Object.keys(rootSchema?.properties ?? {}).length > 0
  const hasChildren = hasProperties || hasComposition || !!(isArray && itemSchemaOrRef)
  const isPrimitive = !hasChildren && rootSchema && rootSchema.type !== 'object'

  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10"
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {isArray && (
            <span className="rounded bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300">
              array
            </span>
          )}
          {resolved?.modelName && (
            <span className="font-mono text-xs font-semibold text-indigo-400">
              {resolved.modelName}
            </span>
          )}
        </div>
      </header>

      {hasChildren ? (
        <div role="tree" aria-label={`Estructura de ${title}`} className="overflow-x-auto p-3">
          {isArray && itemSchemaOrRef ? (
            <SchemaNodes schemaOrRef={itemSchemaOrRef} document={document} depth={0} />
          ) : (
            <SchemaNodes schemaOrRef={schema} document={document} depth={0} />
          )}
        </div>
      ) : isPrimitive && rootSchema ? (
        <PrimitiveSchema schema={rootSchema} />
      ) : (
        <p className="px-4 py-4 text-xs text-slate-500 italic">Sin propiedades definidas</p>
      )}
    </section>
  )
}
