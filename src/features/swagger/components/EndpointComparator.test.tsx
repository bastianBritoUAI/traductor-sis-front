// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpenAPIV3 } from 'openapi-types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { EndpointComparator } from './EndpointComparator'

afterEach(cleanup)

vi.mock('./RequestBuilder', () => ({
  RequestBuilder: () => <div>Response body</div>,
}))

const endpoint: SwaggerEndpoint = {
  id: 'users-list',
  method: 'get',
  path: '/users',
  summary: 'Listar usuarios',
  description: 'Obtiene los usuarios disponibles',
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
  it('uses method colors and displays URL before the endpoint description', () => {
    render(<EndpointComparator endpoints={[endpoint]} document={document} />)

    const path = screen.getByText('/users')
    const card = path.closest('section')

    expect(card?.className).toContain('border-blue-500/80')
    expect(screen.getByText('get').className).toContain('bg-blue-600')
    expect(screen.getByText('Obtiene los usuarios disponibles')).toBeTruthy()
  })

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

  it('makes expected models and JSON examples collapsible and resizable', () => {
    render(<EndpointComparator endpoints={[endpoint]} document={document} />)

    fireEvent.click(screen.getByText('200').closest('summary') as HTMLElement)

    const model = screen.getByRole('region', { name: 'Modelo esperado' })
    const example = screen.getByText('Ejemplo JSON').closest('details')

    expect(model.className).toContain('resize')
    expect(example?.querySelector('.resize')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar Modelo esperado' }))
    expect(screen.queryByRole('tree', { name: 'Estructura de Modelo esperado' })).toBeNull()
  })
})
