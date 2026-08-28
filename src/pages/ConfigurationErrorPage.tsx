import { AlertTriangle, Settings2 } from 'lucide-react'

export function ConfigurationErrorPage({ errors }: { errors: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-[#07101d] dark:text-white">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-white p-7 shadow-xl dark:bg-[#0c1726]">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Settings2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-amber-600 uppercase dark:text-amber-400">
              Configuración incompleta
            </p>
            <h1 className="mt-1 text-xl font-bold">No es posible iniciar la aplicación</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Copia <code>.env.example</code> como <code>.env.local</code> y completa las siguientes
              variables:
            </p>
          </div>
        </div>
        <ul className="mt-6 space-y-2">
          {errors.map((error) => (
            <li
              key={error}
              className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 font-mono text-xs text-amber-800 dark:text-amber-200"
            >
              <AlertTriangle className="mt-0.5 shrink-0" size={13} /> {error}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
