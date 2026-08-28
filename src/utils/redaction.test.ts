import { describe, expect, it } from 'vitest'
import { REDACTED_VALUE, redactSensitiveData } from './redaction'

describe('sensitive data redaction', () => {
  it('redacts nested credentials and tokens without mutating other data', () => {
    const result = redactSensitiveData({
      access_token: 'opaque-value',
      profile: { clientSecret: 'hidden', name: 'Ada' },
      status: 200,
    })

    expect(result).toEqual({
      access_token: REDACTED_VALUE,
      profile: { clientSecret: REDACTED_VALUE, name: 'Ada' },
      status: 200,
    })
  })

  it('redacts JWT-shaped string values', () => {
    expect(redactSensitiveData('eyJheader.eyJpayload.signature')).toBe(REDACTED_VALUE)
  })
})
