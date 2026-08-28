import type { HttpMethod } from '../types/swagger'

const styles: Record<HttpMethod, string> = {
  get: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300',
  post: 'border-orange-400/25 bg-orange-400/10 text-orange-700 dark:text-orange-300',
  put: 'border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300',
  patch: 'border-violet-400/25 bg-violet-400/10 text-violet-700 dark:text-violet-300',
  delete: 'border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-300',
  options: 'border-slate-400/25 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  head: 'border-slate-400/25 bg-slate-400/10 text-slate-600 dark:text-slate-300',
}

interface MethodBadgeProps {
  method: HttpMethod
  compact?: boolean
}

export function MethodBadge({ method, compact = false }: MethodBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-bold tracking-wider uppercase ${styles[method]} ${compact ? 'min-w-12 px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
    >
      {method}
    </span>
  )
}
