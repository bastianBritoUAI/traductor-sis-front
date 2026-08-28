const sensitiveKeyPattern =
  /(?:access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|authorization|password|secret)/i
const jwtPattern = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export const REDACTED_VALUE = '[REDACTADO]'

export function redactSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string' && jwtPattern.test(value)) return REDACTED_VALUE
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[REFERENCIA CIRCULAR]'
  seen.add(value)

  if (Array.isArray(value)) {
    return (value as unknown[]).map((item) => redactSensitiveData(item, seen))
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? REDACTED_VALUE : redactSensitiveData(entry, seen),
    ]),
  )
}
