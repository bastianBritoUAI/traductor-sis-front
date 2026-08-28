export interface ComparableExecution {
  id: string
  status: number | 'request-error'
  durationMs: number
  data: unknown
}

export interface ResponseComparison {
  differenceCount: number
  differencePaths: string[]
  differencesTruncated: boolean
  statusesDiffer: boolean
  fastestEndpointId?: string
}

const MAX_TRACKED_PATHS = 2_000
const MAX_REPORTED_DIFFERENCES = 250
const missingValue = Symbol('missing-value')

function flattenValue(
  value: unknown,
  output: Map<string, string>,
  path = '$',
  visited = new WeakSet<object>(),
) {
  if (output.size >= MAX_TRACKED_PATHS) return

  if (value === null || typeof value !== 'object') {
    output.set(path, JSON.stringify(value) ?? String(value))
    return
  }

  if (visited.has(value)) {
    output.set(path, '[Circular]')
    return
  }
  visited.add(value)

  if (Array.isArray(value)) {
    if (!value.length) output.set(path, '[]')
    value.forEach((item, index) => flattenValue(item, output, `${path}[${index}]`, visited))
    return
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) output.set(path, '{}')
  entries.forEach(([key, item]) => {
    const childPath = /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}[${JSON.stringify(key)}]`
    flattenValue(item, output, childPath, visited)
  })
}

export function compareEndpointExecutions(executions: ComparableExecution[]): ResponseComparison {
  if (executions.length < 2) {
    return {
      differenceCount: 0,
      differencePaths: [],
      differencesTruncated: false,
      statusesDiffer: false,
      fastestEndpointId: executions[0]?.id,
    }
  }

  const flattened = executions.map((execution) => {
    const values = new Map<string, string>()
    flattenValue(execution.data, values)
    return values
  })
  const paths = new Set(flattened.flatMap((values) => [...values.keys()]))
  const differencePaths: string[] = []
  let differenceCount = 0

  for (const path of paths) {
    const values = flattened.map((response) => response.get(path) ?? missingValue)
    if (values.every((value) => value === values[0])) continue
    differenceCount += 1
    if (differencePaths.length < MAX_REPORTED_DIFFERENCES) differencePaths.push(path)
  }

  const fastest = executions.reduce((current, execution) =>
    execution.durationMs < current.durationMs ? execution : current,
  )

  return {
    differenceCount,
    differencePaths,
    differencesTruncated:
      differenceCount > MAX_REPORTED_DIFFERENCES ||
      flattened.some((response) => response.size >= MAX_TRACKED_PATHS),
    statusesDiffer: new Set(executions.map((execution) => execution.status)).size > 1,
    fastestEndpointId: fastest.id,
  }
}
