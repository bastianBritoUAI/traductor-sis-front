import type { HttpMethod } from '../types/swagger'

const defaultStyles: Record<HttpMethod, string> = {
  get: 'border-blue-400/25 bg-blue-400/10 text-blue-700 dark:text-blue-300',
  post: 'border-green-400/25 bg-green-400/10 text-green-700 dark:text-green-300',
  put: 'border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300',
  patch: 'border-violet-400/25 bg-violet-400/10 text-violet-700 dark:text-violet-300',
  delete: 'border-red-400/25 bg-red-400/10 text-red-700 dark:text-red-300',
  options: 'border-slate-400/25 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  head: 'border-slate-400/25 bg-slate-400/10 text-slate-600 dark:text-slate-300',
}

const strongStyles: Record<HttpMethod, string> = {
  get: 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/25 dark:border-blue-400 dark:bg-blue-500',
  post: 'border-green-600 bg-green-600 text-white shadow-sm shadow-green-500/25 dark:border-green-400 dark:bg-green-500',
  put: 'border-amber-600 bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25 dark:border-amber-400 dark:bg-amber-400',
  patch:
    'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-500/25 dark:border-violet-400 dark:bg-violet-500',
  delete:
    'border-red-600 bg-red-600 text-white shadow-sm shadow-red-500/25 dark:border-red-400 dark:bg-red-500',
  options:
    'border-slate-600 bg-slate-600 text-white shadow-sm shadow-slate-500/25 dark:border-slate-400 dark:bg-slate-500',
  head: 'border-slate-600 bg-slate-600 text-white shadow-sm shadow-slate-500/25 dark:border-slate-400 dark:bg-slate-500',
}

interface MethodBadgeProps {
  method: HttpMethod
  compact?: boolean
  strong?: boolean
}

export function MethodBadge({ method, compact = false, strong = false }: MethodBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-bold tracking-wider uppercase ${strong ? strongStyles[method] : defaultStyles[method]} ${compact ? 'min-w-12 px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
    >
      {method}
    </span>
  )
}
