import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getHttpStatusMessage, getRequestErrorMessage } from './httpErrors'

describe('HTTP error messages', () => {
  it.each([400, 401, 403, 404, 500])('describes status %s', (status) => {
    expect(getHttpStatusMessage(status)).not.toContain('undefined')
    expect(getHttpStatusMessage(status).length).toBeGreaterThan(10)
  })

  it('identifies request timeouts', () => {
    const error = new AxiosError('timeout', 'ECONNABORTED')
    expect(getRequestErrorMessage(error, 'Endpoint')).toContain('Timeout')
  })

  it('identifies unavailable network resources', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(getRequestErrorMessage(error, 'Swagger')).toContain('no está disponible')
  })
})
