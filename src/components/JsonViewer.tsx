import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'

interface JsonViewerProps {
  value: unknown
  label?: string
  maxHeight?: string
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

export function JsonViewer({ value, label, maxHeight = 'max-h-96' }: JsonViewerProps) {
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

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
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
      <pre className={`${maxHeight} overflow-auto p-4 font-mono text-xs leading-5`}>
        <code>
          {tokens.map((token, index) => (
            <span key={`${index}-${token.kind}`} className={tokenStyles[token.kind]}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
