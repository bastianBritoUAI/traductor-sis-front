import { describe, expect, it } from 'vitest'
import { compareEndpointExecutions } from './responseComparison'

describe('response comparison', () => {
  it('finds status and nested response differences', () => {
    const comparison = compareEndpointExecutions([
      {
        id: 'first',
        status: 200,
        durationMs: 80,
        data: { person: { name: 'Ada', roles: ['admin'] } },
      },
      {
        id: 'second',
        status: 404,
        durationMs: 120,
        data: { person: { name: 'Grace', roles: ['reader'] } },
      },
    ])

    expect(comparison.statusesDiffer).toBe(true)
    expect(comparison.differencePaths).toEqual(['$.person.name', '$.person.roles[0]'])
    expect(comparison.fastestEndpointId).toBe('first')
  })

  it('detects missing fields and equal payloads', () => {
    const missingField = compareEndpointExecutions([
      { id: 'first', status: 200, durationMs: 10, data: { id: 1, active: true } },
      { id: 'second', status: 200, durationMs: 12, data: { id: 1 } },
    ])
    const equalPayloads = compareEndpointExecutions([
      { id: 'first', status: 200, durationMs: 10, data: { id: 1 } },
      { id: 'second', status: 200, durationMs: 12, data: { id: 1 } },
    ])

    expect(missingField.differencePaths).toEqual(['$.active'])
    expect(equalPayloads.differenceCount).toBe(0)
    expect(equalPayloads.statusesDiffer).toBe(false)
  })
})
