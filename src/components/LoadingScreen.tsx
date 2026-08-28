import { Boxes } from 'lucide-react'

export function LoadingScreen({ label = 'Preparando el explorador…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#07101d]">
      <div className="text-center">
        <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <div className="absolute inset-0 animate-ping rounded-2xl border border-emerald-400/30" />
          <Boxes className="relative animate-pulse" size={30} />
        </div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="mt-1 text-sm text-slate-500">Esto tomará solo un momento</p>
      </div>
    </div>
  )
}
