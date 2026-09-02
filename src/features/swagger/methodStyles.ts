import type { HttpMethod } from '../../types/swagger'

export interface MethodContainerAppearance {
  collapsed: string
  expanded: string
  header: string
  expandedHeader: string
  details: string
  indicator: string
  focus: string
}

export const methodContainerStyles: Record<HttpMethod, MethodContainerAppearance> = {
  get: {
    collapsed: 'border-blue-300/60 bg-blue-50/40 dark:border-blue-400/20 dark:bg-blue-500/[0.035]',
    expanded:
      'border-blue-500/80 bg-blue-50/90 shadow-sm shadow-blue-500/15 ring-1 ring-blue-500/10 dark:border-blue-400/50 dark:bg-blue-500/[0.09]',
    header: 'hover:bg-blue-500/[0.07] dark:hover:bg-blue-400/[0.07]',
    expandedHeader: 'bg-blue-500/[0.08] dark:bg-blue-400/[0.07]',
    details: 'border-blue-500/25 bg-blue-50/50 dark:border-blue-400/20 dark:bg-blue-950/10',
    indicator: 'text-blue-500 group-hover:text-blue-700 dark:text-blue-400',
    focus: 'focus-visible:outline-blue-500',
  },
  post: {
    collapsed:
      'border-green-300/60 bg-green-50/40 dark:border-green-400/20 dark:bg-green-500/[0.035]',
    expanded:
      'border-green-500/80 bg-green-50/90 shadow-sm shadow-green-500/15 ring-1 ring-green-500/10 dark:border-green-400/50 dark:bg-green-500/[0.09]',
    header: 'hover:bg-green-500/[0.07] dark:hover:bg-green-400/[0.07]',
    expandedHeader: 'bg-green-500/[0.08] dark:bg-green-400/[0.07]',
    details: 'border-green-500/25 bg-green-50/50 dark:border-green-400/20 dark:bg-green-950/10',
    indicator: 'text-green-500 group-hover:text-green-700 dark:text-green-400',
    focus: 'focus-visible:outline-green-500',
  },
  put: {
    collapsed:
      'border-amber-300/70 bg-amber-50/50 dark:border-amber-400/20 dark:bg-amber-500/[0.035]',
    expanded:
      'border-amber-500/80 bg-amber-50/90 shadow-sm shadow-amber-500/15 ring-1 ring-amber-500/10 dark:border-amber-400/50 dark:bg-amber-500/[0.09]',
    header: 'hover:bg-amber-500/[0.08] dark:hover:bg-amber-400/[0.07]',
    expandedHeader: 'bg-amber-500/[0.09] dark:bg-amber-400/[0.07]',
    details: 'border-amber-500/25 bg-amber-50/50 dark:border-amber-400/20 dark:bg-amber-950/10',
    indicator: 'text-amber-600 group-hover:text-amber-700 dark:text-amber-400',
    focus: 'focus-visible:outline-amber-500',
  },
  patch: {
    collapsed:
      'border-violet-300/60 bg-violet-50/40 dark:border-violet-400/20 dark:bg-violet-500/[0.035]',
    expanded:
      'border-violet-500/80 bg-violet-50/90 shadow-sm shadow-violet-500/15 ring-1 ring-violet-500/10 dark:border-violet-400/50 dark:bg-violet-500/[0.09]',
    header: 'hover:bg-violet-500/[0.07] dark:hover:bg-violet-400/[0.07]',
    expandedHeader: 'bg-violet-500/[0.08] dark:bg-violet-400/[0.07]',
    details: 'border-violet-500/25 bg-violet-50/50 dark:border-violet-400/20 dark:bg-violet-950/10',
    indicator: 'text-violet-500 group-hover:text-violet-700 dark:text-violet-400',
    focus: 'focus-visible:outline-violet-500',
  },
  delete: {
    collapsed: 'border-red-300/60 bg-red-50/40 dark:border-red-400/20 dark:bg-red-500/[0.035]',
    expanded:
      'border-red-500/80 bg-red-50/90 shadow-sm shadow-red-500/15 ring-1 ring-red-500/10 dark:border-red-400/50 dark:bg-red-500/[0.09]',
    header: 'hover:bg-red-500/[0.07] dark:hover:bg-red-400/[0.07]',
    expandedHeader: 'bg-red-500/[0.08] dark:bg-red-400/[0.07]',
    details: 'border-red-500/25 bg-red-50/50 dark:border-red-400/20 dark:bg-red-950/10',
    indicator: 'text-red-500 group-hover:text-red-700 dark:text-red-400',
    focus: 'focus-visible:outline-red-500',
  },
  options: {
    collapsed:
      'border-slate-300/80 bg-slate-100/60 dark:border-slate-400/20 dark:bg-slate-500/[0.04]',
    expanded:
      'border-slate-500/80 bg-slate-100/90 shadow-sm shadow-slate-500/15 ring-1 ring-slate-500/10 dark:border-slate-400/50 dark:bg-slate-500/[0.1]',
    header: 'hover:bg-slate-500/[0.08] dark:hover:bg-slate-400/[0.07]',
    expandedHeader: 'bg-slate-500/[0.09] dark:bg-slate-400/[0.07]',
    details: 'border-slate-500/25 bg-slate-100/60 dark:border-slate-400/20 dark:bg-slate-950/10',
    indicator: 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400',
    focus: 'focus-visible:outline-slate-500',
  },
  head: {
    collapsed:
      'border-slate-300/80 bg-slate-100/60 dark:border-slate-400/20 dark:bg-slate-500/[0.04]',
    expanded:
      'border-slate-500/80 bg-slate-100/90 shadow-sm shadow-slate-500/15 ring-1 ring-slate-500/10 dark:border-slate-400/50 dark:bg-slate-500/[0.1]',
    header: 'hover:bg-slate-500/[0.08] dark:hover:bg-slate-400/[0.07]',
    expandedHeader: 'bg-slate-500/[0.09] dark:bg-slate-400/[0.07]',
    details: 'border-slate-500/25 bg-slate-100/60 dark:border-slate-400/20 dark:bg-slate-950/10',
    indicator: 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400',
    focus: 'focus-visible:outline-slate-500',
  },
}
