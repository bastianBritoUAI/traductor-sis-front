import { AlertCircle, Braces } from 'lucide-react'
import { useMemo } from 'react'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function JsonEditor({ value, onChange, label = 'Request JSON' }: JsonEditorProps) {
  const error = useMemo(() => {
    if (!value.trim()) return undefined
    try {
      JSON.parse(value)
      return undefined
    } catch (caught) {
      return caught instanceof Error ? caught.message : 'JSON inválido'
    }
  }, [value])

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Braces size={14} /> {label}
        </span>
        <span className={error ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>
          {error ? 'JSON inválido' : 'JSON válido'}
        </span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        rows={14}
        className={`w-full resize-y rounded-xl border bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 transition outline-none focus:ring-2 ${error ? 'border-rose-500/60 focus:ring-rose-500/20' : 'border-slate-700 focus:border-cyan-500/60 focus:ring-cyan-500/20'}`}
      />
      {error && (
        <span className="mt-2 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="mt-0.5 shrink-0" size={13} /> {error}
        </span>
      )}
    </label>
  )
}
