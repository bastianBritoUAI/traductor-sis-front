// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { RequestBuilder } from './RequestBuilder'

const endpoint: SwaggerEndpoint = {
  id: 'GET /users',
  method: 'get',
  path: '/users',
  summary: 'Listar usuarios',
  tags: ['Usuarios'],
  deprecated: false,
  parameters: [],
  responses: [],
}

afterEach(cleanup)

describe('RequestBuilder compact console', () => {
  it('collapses its fields while keeping clear and execute actions visible', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RequestBuilder endpoint={endpoint} compact />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar Consola de pruebas' }))

    expect(screen.queryByText(/Esta operación no requiere datos de entrada/)).toBeNull()
    expect(screen.getByRole('button', { name: /Limpiar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ejecutar/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Consola de pruebas' }))

    expect(screen.getByText(/Esta operación no requiere datos de entrada/)).toBeTruthy()
  })
})
