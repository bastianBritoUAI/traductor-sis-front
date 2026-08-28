import type { OpenAPIV3 } from 'openapi-types'
import type { SwaggerParameter } from '../../../types/swagger'
import { getSchemaType, plainText } from '../../../utils/openapi'

interface ParameterTableProps {
  parameters: SwaggerParameter[]
}

const locationLabels: Record<OpenAPIV3.ParameterObject['in'], string> = {
  path: 'Path',
  query: 'Query',
  header: 'Header',
  cookie: 'Cookie',
}

export function ParameterTable({ parameters }: ParameterTableProps) {
  if (!parameters.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-white/10">
        Este endpoint no recibe parámetros.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase dark:bg-white/[0.03] dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Tipo</th>
            <th className="px-4 py-3 font-semibold">Ubicación</th>
            <th className="px-4 py-3 font-semibold">Requerido</th>
            <th className="px-4 py-3 font-semibold">Descripción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {parameters.map((parameter) => (
            <tr key={`${parameter.location}-${parameter.name}`}>
              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                {parameter.name}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                {getSchemaType(parameter.schema)}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {locationLabels[parameter.location]}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-semibold ${parameter.required ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400'}`}
                >
                  {parameter.required ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="max-w-sm px-4 py-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {plainText(parameter.description) || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
