import { ChevronDown, ChevronRight } from 'lucide-react'
import type { OpenAPIV3 } from 'openapi-types'
import { useState } from 'react'
import { isReferenceObject, plainText, resolveReference } from '../utils/openapi'

export interface SchemaViewerProps {
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  document: OpenAPIV3.Document
  label?: string
}

// ── helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  string: 'text-emerald-400',
  integer: 'text-amber-400',
  number: 'text-amber-400',
  boolean: 'text-violet-400',
  object: 'text-sky-400',
  array: 'text-sky-300',
}

function resolveSchemaRef(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
  visited: Set<string> = new Set(),
): { schema: OpenAPIV3.SchemaObject; modelName?: string } | null {
  if (!isReferenceObject(schemaOrRef)) return { schema: schemaOrRef }
  if (visited.has(schemaOrRef.$ref)) return null
  const modelName = schemaOrRef.$ref.split('/').at(-1)
  const resolved = resolveReference<OpenAPIV3.SchemaObject>(document, schemaOrRef.$ref)
  if (!resolved) return null
  return { schema: resolved, modelName }
}

function mergeAllOf(
  parts: Array<OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>,
  document: OpenAPIV3.Document,
  visited: Set<string> = new Set(),
): OpenAPIV3.SchemaObject {
  const merged: OpenAPIV3.SchemaObject = { type: 'object', properties: {}, required: [] }
  for (const part of parts) {
    const r = isReferenceObject(part)
      ? (() => {
          if (visited.has(part.$ref)) return null
          const s = resolveReference<OpenAPIV3.SchemaObject>(document, part.$ref)
          return s ? { schema: s } : null
        })()
      : { schema: part }
    if (!r) continue
    const effective = r.schema.allOf
      ? mergeAllOf(r.schema.allOf, document, new Set(visited))
      : r.schema
    Object.assign(merged.properties!, effective.properties ?? {})
    if (effective.required?.length) {
      merged.required = [...(merged.required ?? []), ...effective.required]
    }
  }
  return merged
}

function typeLabel(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): string {
  if (isReferenceObject(schemaOrRef)) {
    return schemaOrRef.$ref.split('/').at(-1) ?? 'object'
  }
  const s = schemaOrRef
  if (s.type === 'array') {
    if (!s.items) return 'array'
    const inner = isReferenceObject(s.items)
      ? (s.items.$ref.split('/').at(-1) ?? 'object')
      : s.items.format
        ? `${s.items.type ?? 'string'}($${s.items.format})`
        : (s.items.type ?? 'object')
    return `array[${inner}]`
  }
  if (s.oneOf) return `oneOf [${s.oneOf.length}]`
  if (s.anyOf) return `anyOf [${s.anyOf.length}]`
  if (s.allOf) return `allOf [${s.allOf.length}]`
  if (s.format) return `${s.type ?? 'object'}($${s.format})`
  return s.type ?? 'object'
}

function typeColor(schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): string {
  if (isReferenceObject(schemaOrRef)) return 'text-indigo-400'
  const key = schemaOrRef.type ?? 'object'
  return TYPE_COLORS[key] ?? 'text-slate-400'
}

function isExpandable(
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): boolean {
  const r = resolveSchemaRef(schemaOrRef, document)
  if (!r) return false
  const s = r.schema.allOf ? mergeAllOf(r.schema.allOf, document) : r.schema
  if (s.properties && Object.keys(s.properties).length > 0) return true
  if (s.oneOf?.length || s.anyOf?.length) return true
  if (s.type === 'array' && s.items) {
    const itemR = resolveSchemaRef(s.items, document)
    if (!itemR) return false
    const is = itemR.schema.allOf ? mergeAllOf(itemR.schema.allOf, document) : itemR.schema
    return !!(is.properties && Object.keys(is.properties).length > 0)
  }
  return false
}

// ── components ───────────────────────────────────────────────────────────────

interface SchemaRowsProps {
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  document: OpenAPIV3.Document
  depth: number
}

function SchemaRows({ schemaOrRef, document, depth }: SchemaRowsProps) {
  const r = resolveSchemaRef(schemaOrRef, document)
  if (!r) return null

  let s = r.schema

  if (s.allOf) s = mergeAllOf(s.allOf, document)

  // oneOf / anyOf – render each variant separated
  const composition = s.oneOf ?? s.anyOf
  if (composition?.length) {
    const keyword = s.oneOf ? 'oneOf' : 'anyOf'
    return (
      <>
        {composition.map((option, i) => (
          <>
            {i > 0 && (
              <tr key={`${keyword}-sep-${i}`}>
                <td
                  colSpan={3}
                  className="py-1.5 text-center text-[10px] font-semibold tracking-widest text-slate-600 uppercase"
                >
                  — {keyword} —
                </td>
              </tr>
            )}
            <SchemaRows key={`${keyword}-${i}`} schemaOrRef={option} document={document} depth={depth} />
          </>
        ))}
      </>
    )
  }

  const properties = s.properties ?? {}
  const required = s.required ?? []

  if (Object.keys(properties).length === 0) return null

  return (
    <>
      {Object.entries(properties).map(([name, propSchema]) => (
        <PropertyRow
          key={name}
          name={name}
          required={required.includes(name)}
          schemaOrRef={propSchema}
          document={document}
          depth={depth}
        />
      ))}
    </>
  )
}

interface PropertyRowProps {
  name: string
  required: boolean
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  document: OpenAPIV3.Document
  depth: number
}

function PropertyRow({ name, required, schemaOrRef, document, depth }: PropertyRowProps) {
  const [open, setOpen] = useState(depth < 1)
  const expandable = isExpandable(schemaOrRef, document)

  const r = resolveSchemaRef(schemaOrRef, document)
  const effective = r ? (r.schema.allOf ? mergeAllOf(r.schema.allOf, document) : r.schema) : undefined
  const description = effective?.description ? plainText(effective.description) : undefined
  const enumValues = effective?.enum as unknown[] | undefined
  const nullable = effective?.nullable

  // For arrays expand the item schema; for objects expand self
  const expandTarget: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined =
    effective?.type === 'array' && effective.items ? effective.items : schemaOrRef

  return (
    <>
      <tr
        className={`border-b border-white/5 transition-colors ${expandable ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
        onClick={expandable ? () => setOpen((v) => !v) : undefined}
      >
        {/* name column */}
        <td
          className="py-2 pr-3 align-top"
          style={{ paddingLeft: `${16 + depth * 18}px` }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {expandable &&
              (open ? (
                <ChevronDown className="shrink-0 text-slate-500" size={13} />
              ) : (
                <ChevronRight className="shrink-0 text-slate-500" size={13} />
              ))}
            <span className="font-mono text-xs font-semibold text-slate-100">{name}</span>
            {required && (
              <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-rose-500/15 text-rose-400">
                required
              </span>
            )}
            {nullable && (
              <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-slate-700 text-slate-400">
                nullable
              </span>
            )}
          </div>
        </td>
        {/* type column */}
        <td className="py-2 pr-4 align-top whitespace-nowrap">
          <span className={`font-mono text-xs ${typeColor(schemaOrRef)}`}>
            {typeLabel(schemaOrRef, document)}
          </span>
        </td>
        {/* description column */}
        <td className="py-2 pr-4 align-top text-xs text-slate-400 max-w-xs">
          {description && <span>{description}</span>}
          {enumValues?.length ? (
            <span className={`block text-[10px] text-slate-500 ${description ? 'mt-0.5' : ''}`}>
              {enumValues.map(String).join(' | ')}
            </span>
          ) : null}
        </td>
      </tr>
      {expandable && open && expandTarget && (
        <SchemaRows schemaOrRef={expandTarget} document={document} depth={depth + 1} />
      )}
    </>
  )
}

// ── public component ─────────────────────────────────────────────────────────

export function SchemaViewer({ schema, document, label }: SchemaViewerProps) {
  if (!schema) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10">
        <div className="border-b border-white/10 px-4 py-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {label ?? 'Modelo esperado'}
          </span>
        </div>
        <p className="px-4 py-4 text-xs text-slate-500 italic">Sin modelo definido</p>
      </div>
    )
  }

  const r = resolveSchemaRef(schema, document)
  const modelName = r?.modelName
  let rootSchema = r ? (r.schema.allOf ? mergeAllOf(r.schema.allOf, document) : r.schema) : undefined

  const isArray = rootSchema?.type === 'array'
  const itemSchemaOrRef = isArray ? rootSchema?.items : undefined

  const hasComposition = !!(rootSchema?.oneOf?.length ?? rootSchema?.anyOf?.length)
  const hasProperties = !!(rootSchema?.properties && Object.keys(rootSchema.properties).length > 0)
  const hasChildren = hasProperties || hasComposition || !!(isArray && itemSchemaOrRef)
  const isPrimitive = !hasChildren && rootSchema && rootSchema.type !== 'object'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {label ?? 'Modelo esperado'}
        </span>
        <div className="flex items-center gap-2">
          {isArray && (
            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
              array
            </span>
          )}
          {modelName && (
            <span className="font-mono text-xs font-semibold text-indigo-400">{modelName}</span>
          )}
        </div>
      </div>

      {hasChildren ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-2 text-left text-[10px] font-semibold tracking-[0.1em] text-slate-600 uppercase">
                  Campo
                </th>
                <th className="py-2 pr-4 text-left text-[10px] font-semibold tracking-[0.1em] text-slate-600 uppercase">
                  Tipo
                </th>
                <th className="py-2 pr-4 text-left text-[10px] font-semibold tracking-[0.1em] text-slate-600 uppercase">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody>
              {isArray && itemSchemaOrRef ? (
                <SchemaRows schemaOrRef={itemSchemaOrRef} document={document} depth={0} />
              ) : (
                <SchemaRows schemaOrRef={schema} document={document} depth={0} />
              )}
            </tbody>
          </table>
        </div>
      ) : isPrimitive && rootSchema ? (
        <div className="px-4 py-3">
          <span className={`font-mono text-xs ${typeColor(rootSchema)}`}>
            {typeLabel(rootSchema, document)}
          </span>
          {rootSchema.description && (
            <p className="mt-1 text-xs text-slate-400">{plainText(rootSchema.description)}</p>
          )}
        </div>
      ) : (
        <p className="px-4 py-4 text-xs text-slate-500 italic">Sin propiedades definidas</p>
      )}
    </div>
  )
}
