// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import type { OpenAPIV3 } from 'openapi-types'
import { describe, expect, it, vi } from 'vitest'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { EndpointComparator } from './EndpointComparator'

vi.mock('./RequestBuilder', () => ({
  RequestBuilder: () => <div>Response body</div>,
}))

const endpoint: SwaggerEndpoint = {
  id: 'users-list',
  method: 'get',
  path: '/users',
  summary: 'Listar usuarios',
  tags: ['Usuarios'],
  deprecated: false,
  parameters: [],
  responses: [
    {
      status: '200',
      description: 'Operación exitosa',
      contentType: 'application/json',
      schema: { type: 'array', items: { type: 'string' } },
      example: ['Ada'],
    },
  ],
}

const document = {
  openapi: '3.0.1',
  info: { title: 'API de prueba', version: '1.0.0' },
  paths: {},
} as OpenAPIV3.Document

describe('EndpointComparator', () => {
  it('shows the declared responses below the response body', () => {
    render(<EndpointComparator endpoints={[endpoint]} document={document} />)

    const responseBody = screen.getByText('Response body')
    const responses = screen.getByRole('heading', { name: 'Respuestas' })

    expect(
      responseBody.compareDocumentPosition(responses) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.getByText('Operación exitosa')).toBeTruthy()
  })
})
