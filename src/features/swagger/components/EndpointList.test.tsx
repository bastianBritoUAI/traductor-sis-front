// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpenAPIV3 } from 'openapi-types'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { EndpointList } from './EndpointList'

vi.mock('./EndpointDetails', () => ({
  EndpointDetails: ({ endpoint }: { endpoint: SwaggerEndpoint }) => (
    <div data-testid={`details-${endpoint.id}`}>Detalle de {endpoint.summary}</div>
  ),
}))

const endpoints: SwaggerEndpoint[] = [
  {
    id: 'users-list',
    method: 'get',
    path: '/users',
    summary: 'Listar usuarios',
    tags: ['Usuarios'],
    deprecated: false,
    parameters: [],
    responses: [],
  },
  {
    id: 'users-create',
    method: 'post',
    path: '/users',
    summary: 'Crear usuario',
    tags: ['Usuarios'],
    deprecated: false,
    parameters: [],
    responses: [],
  },
]

const document = {
  openapi: '3.0.1',
  info: { title: 'API de prueba', version: '1.0.0' },
  paths: {},
} as OpenAPIV3.Document

afterEach(cleanup)

function EndpointListHarness() {
  const [expandedEndpointIds, setExpandedEndpointIds] = useState<string[]>([])
  const [comparisonEndpointIds, setComparisonEndpointIds] = useState<string[]>([])

  const toggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((current) =>
      current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id],
    )

  return (
    <EndpointList
      endpoints={endpoints}
      document={document}
      apiTitle="API de prueba"
      apiVersion="1.0.0"
      expandedEndpointIds={expandedEndpointIds}
      comparisonEndpointIds={comparisonEndpointIds}
      onToggleDetails={(id) => toggle(id, setExpandedEndpointIds)}
      onToggleComparison={(id) => toggle(id, setComparisonEndpointIds)}
    />
  )
}

describe('EndpointList', () => {
  it('keeps the endpoint search visible while the main view scrolls', () => {
    render(<EndpointListHarness />)

    const stickySearch = screen
      .getByRole('searchbox', { name: 'Buscar endpoints' })
      .closest('.sticky')

    expect(stickySearch?.className).toContain('top-[49px]')
    expect(stickySearch?.className).toContain('z-20')
  })

  it('keeps multiple endpoint details expanded in the main view', () => {
    render(<EndpointListHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Listar usuarios' }))
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Crear usuario' }))

    expect(screen.getByTestId('details-users-list')).toBeTruthy()
    expect(screen.getByTestId('details-users-create')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Contraer Listar usuarios' }).closest('[id^="endpoint-"]')
        ?.className,
    ).toContain('border-emerald-400/70')
    expect(
      screen.getByRole('button', { name: 'Contraer Listar usuarios' }).closest('[id^="endpoint-"]')
        ?.className,
    ).toContain('bg-emerald-50/80')
  })

  it('selects an endpoint for comparison without expanding its details', () => {
    render(<EndpointListHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Listar usuarios al comparador' }))

    expect(screen.queryByTestId('details-users-list')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Quitar Listar usuarios del comparador' }),
    ).toBeTruthy()
  })

  it('filters endpoints by their searchable contract data', () => {
    render(<EndpointListHarness />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar endpoints' }), {
      target: { value: 'post crear' },
    })

    expect(screen.queryByRole('button', { name: 'Expandir Listar usuarios' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Expandir Crear usuario' })).toBeTruthy()
    expect(screen.getByText('1 coincidencia')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda de endpoints' }))

    expect(screen.getByRole('button', { name: 'Expandir Listar usuarios' })).toBeTruthy()
  })
})
