import type { HttpMethod } from '../types/swagger'

const styles: Record<HttpMethod, string> = {
  get: 'border-blue-400/25 bg-blue-400/10 text-blue-700 dark:text-blue-300',
  post: 'border-green-400/25 bg-green-400/10 text-green-700 dark:text-green-300',
  put: 'border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300',
  patch: 'border-violet-400/25 bg-violet-400/10 text-violet-700 dark:text-violet-300',
  delete: 'border-red-400/25 bg-red-400/10 text-red-700 dark:text-red-300',
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
