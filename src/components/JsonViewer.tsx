import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'

interface JsonViewerProps {
  value: unknown
  label?: string
  maxHeight?: string
  fillHeight?: boolean
  collapsed?: boolean
  collapsibleNodes?: boolean
  footer?: React.ReactNode
}

interface JsonToken {
  value: string
  kind: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation'
}

function tokenizeJson(json: string): JsonToken[] {
  const pattern =
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")|\b(true|false)\b|\b(null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],]/g
  const tokens: JsonToken[] = []
  let cursor = 0

  for (const match of json.matchAll(pattern)) {
    const index = match.index
    if (index > cursor) tokens.push({ value: json.slice(cursor, index), kind: 'punctuation' })
    const value = match[0]
    const trimmed = value.trim()
    let kind: JsonToken['kind'] = 'punctuation'
    if (trimmed.startsWith('"')) kind = trimmed.endsWith(':') ? 'key' : 'string'
    else if (trimmed === 'true' || trimmed === 'false') kind = 'boolean'
    else if (trimmed === 'null') kind = 'null'
    else if (/^-?\d/.test(trimmed)) kind = 'number'
    tokens.push({ value, kind })
    cursor = index + value.length
  }

  if (cursor < json.length) tokens.push({ value: json.slice(cursor), kind: 'punctuation' })
  return tokens
}

const tokenStyles: Record<JsonToken['kind'], string> = {
  key: 'text-sky-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  boolean: 'text-violet-300',
  null: 'text-rose-300',
  punctuation: 'text-slate-300',
}

export function JsonViewer({
  value,
  label,
  maxHeight = 'max-h-96',
  fillHeight = false,
  collapsed = false,
  collapsibleNodes = false,
  footer,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false)
  const json = useMemo(() => {
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch {
        return value
      }
    }
    return JSON.stringify(value ?? null, null, 2)
  }, [value])
  const tokens = useMemo(() => tokenizeJson(json), [json])
  const treeValue = useMemo(() => {
    if (typeof value !== 'string') return value ?? null
    try {
      return JSON.parse(value) as unknown
    } catch {
      return value
    }
  }, [value])

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const contentHeight = fillHeight ? 'min-h-0 flex-1' : maxHeight

  const content =
    collapsibleNodes && isJsonContainer(treeValue) ? (
      <JsonTree key={json} value={treeValue} maxHeight={contentHeight} />
    ) : (
      <pre className={`${contentHeight} overflow-auto p-4 font-mono text-xs leading-5`}>
        <code>
          {tokens.map((token, index) => (
            <span key={`${index}-${token.kind}`} className={tokenStyles[token.kind]}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    )

  if (collapsed) {
    return (
      <details className="group/json overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10">
        <summary className="flex list-none items-center justify-between gap-3 px-4 py-2.5 marker:hidden">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {label ?? 'JSON'}
          </span>
          <span className="inline-flex items-center gap-2 text-[10px] text-slate-500">
            Mostrar
            <ChevronDown className="transition-transform group-open/json:rotate-180" size={14} />
          </span>
        </summary>
        <div className="border-t border-white/10">
          <div className="flex justify-end border-b border-white/10 px-2 py-1">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label={`Copiar ${label ?? 'JSON'}`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          {content}
        </div>
        {footer}
      </details>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10 ${
        fillHeight ? 'flex h-full min-h-0 flex-col' : ''
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {label ?? 'JSON'}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Copiar JSON"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {content}
      {footer}
    </div>
  )
}

type JsonContainer = Record<string, unknown> | unknown[]

function isJsonContainer(value: unknown): value is JsonContainer {
  return typeof value === 'object' && value !== null
}

function JsonTree({ value, maxHeight }: { value: JsonContainer; maxHeight: string }) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())

  const togglePath = (path: string) => {
    setCollapsedPaths((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div
      className={`${maxHeight} overflow-auto p-4 font-mono text-xs leading-5`}
      aria-label="Árbol de respuesta JSON"
    >
      <JsonTreeNode
        value={value}
        path="$"
        depth={0}
        isLast
        collapsedPaths={collapsedPaths}
        onToggle={togglePath}
      />
    </div>
  )
}

interface JsonTreeNodeProps {
  value: unknown
  name?: string
  path: string
  depth: number
  isLast: boolean
  collapsedPaths: Set<string>
  onToggle: (path: string) => void
}

function JsonTreeNode({
  value,
  name,
  path,
  depth,
  isLast,
  collapsedPaths,
  onToggle,
}: JsonTreeNodeProps) {
  const prefix =
    name === undefined ? null : (
      <>
        <span className={tokenStyles.key}>{JSON.stringify(name)}</span>
        <span className={tokenStyles.punctuation}>: </span>
      </>
    )

  if (!isJsonContainer(value)) {
    return (
      <div
        className="flex min-h-5 min-w-max items-center whitespace-pre"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <span className="inline-block w-4 shrink-0" />
        {prefix}
        <JsonPrimitive value={value} />
        {!isLast && <span className={tokenStyles.punctuation}>,</span>}
      </div>
    )
  }

  const array = Array.isArray(value)
  const entries: Array<[string | undefined, unknown, string]> = array
    ? value.map((item, index) => [undefined, item, `${path}[${index}]`])
    : Object.entries(value).map(([key, item]) => [key, item, `${path}.${key}`])
  const opening = array ? '[' : '{'
  const closing = array ? ']' : '}'

  if (!entries.length) {
    return (
      <div
        className="flex min-h-5 min-w-max items-center whitespace-pre"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <span className="inline-block w-4 shrink-0" />
        {prefix}
        <span className={tokenStyles.punctuation}>
          {opening}
          {closing}
          {!isLast && ','}
        </span>
      </div>
    )
  }

  const nodeCollapsed = collapsedPaths.has(path)
  const accessibleName =
    name !== undefined ? `campo ${name}` : path === '$' ? 'respuesta JSON' : path

  return (
    <>
      <div
        className="flex min-h-5 min-w-max items-center whitespace-pre"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <button
          type="button"
          onClick={() => onToggle(path)}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-slate-500 transition hover:bg-white/10 hover:text-white"
          aria-expanded={!nodeCollapsed}
          aria-label={`${nodeCollapsed ? 'Expandir' : 'Colapsar'} ${accessibleName}`}
        >
          <ChevronRight className={`transition ${nodeCollapsed ? '' : 'rotate-90'}`} size={12} />
        </button>
        {prefix}
        <span className={tokenStyles.punctuation}>{opening}</span>
        {nodeCollapsed && (
          <>
            <span className="text-slate-500">
              {' '}
              … {entries.length} {array ? 'elementos' : 'campos'}{' '}
            </span>
            <span className={tokenStyles.punctuation}>
              {closing}
              {!isLast && ','}
            </span>
          </>
        )}
      </div>

      {!nodeCollapsed &&
        entries.map(([childName, childValue, childPath], index) => (
          <JsonTreeNode
            key={childPath}
            value={childValue}
            name={childName}
            path={childPath}
            depth={depth + 1}
            isLast={index === entries.length - 1}
            collapsedPaths={collapsedPaths}
            onToggle={onToggle}
          />
        ))}

      {!nodeCollapsed && (
        <div
          className="flex min-h-5 min-w-max items-center whitespace-pre"
          style={{ paddingLeft: `${depth * 1.25}rem` }}
        >
          <span className="inline-block w-4 shrink-0" />
          <span className={tokenStyles.punctuation}>
            {closing}
            {!isLast && ','}
          </span>
        </div>
      )}
    </>
  )
}

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className={tokenStyles.null}>null</span>
  }
  if (typeof value === 'string') {
    return <span className={tokenStyles.string}>{JSON.stringify(value)}</span>
  }
  if (typeof value === 'boolean') {
    return <span className={tokenStyles.boolean}>{String(value)}</span>
  }
  if (typeof value === 'number') {
    return <span className={tokenStyles.number}>{String(value)}</span>
  }
  if (typeof value === 'bigint') {
    return <span className={tokenStyles.number}>{value.toString()}</span>
  }
  return <span className={tokenStyles.null}>{JSON.stringify(value) ?? 'null'}</span>
}
