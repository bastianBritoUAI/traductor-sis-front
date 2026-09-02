// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpenAPIV3 } from 'openapi-types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '../../../store/uiStore'
import { SwaggerExplorer } from './SwaggerExplorer'

vi.mock('../../../hooks/useOpenApi', () => ({
  useOpenApi: () => ({
    data: {
      document: {
        openapi: '3.0.1',
        info: { title: 'API de prueba', version: '1.0.0' },
        paths: {},
      } as OpenAPIV3.Document,
      endpoints: [],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('./EndpointList', () => ({
  EndpointList: () => <div>Vista principal de endpoints</div>,
}))

vi.mock('./EndpointComparator', () => ({
  EndpointComparator: () => <div>Vista de comparación</div>,
}))

vi.mock('./SidebarSwagger', () => ({
  SidebarSwagger: () => <aside aria-label="Listado lateral de endpoints" />,
}))

beforeEach(() => {
  useUiStore.setState({ explorerView: 'details', sidebarOpen: false, sidebarCollapsed: false })
})

afterEach(cleanup)

describe('SwaggerExplorer views', () => {
  it('shows the endpoint sidebar only in comparison view', () => {
    render(<SwaggerExplorer />)

    expect(screen.getByText('Vista principal de endpoints')).toBeTruthy()
    expect(screen.queryByLabelText('Listado lateral de endpoints')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Comparador/ }))

    expect(screen.getByText('Vista de comparación')).toBeTruthy()
    expect(screen.getByLabelText('Listado lateral de endpoints')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Endpoints' }))

    expect(screen.queryByLabelText('Listado lateral de endpoints')).toBeNull()
  })
})
