// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { EndpointExecutionResult } from '../../../types/swagger'
import { ResponseViewer } from './ResponseViewer'

const result: EndpointExecutionResult = {
  url: 'https://api.example.test/users',
  method: 'GET',
  status: 200,
  statusText: 'OK',
  timestamp: '2026-09-02T12:00:00.000Z',
  durationMs: 42,
  request: { page: 1 },
  headers: { 'content-type': 'application/json' },
  data: { items: [{ id: 1 }] },
}

afterEach(cleanup)

describe('ResponseViewer compact panels', () => {
  it('makes request, headers, and response body resizable', () => {
    render(<ResponseViewer result={result} compact />)

    const request = screen.getByText('Request enviada').closest('details')
    const headers = screen.getByText('Headers de respuesta').closest('details')
    const response = screen.getByText('Response body').closest('details')

    expect(request?.querySelector('.resize')).toBeTruthy()
    expect(headers?.querySelector('.resize')).toBeTruthy()
    expect(response?.querySelector('.resize')).toBeTruthy()
    expect(response?.open).toBe(true)

    fireEvent.click(response?.querySelector('summary') as HTMLElement)
    expect(response?.open).toBe(false)
  })
})
