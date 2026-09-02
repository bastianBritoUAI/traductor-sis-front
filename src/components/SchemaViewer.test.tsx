// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpenAPIV3 } from 'openapi-types'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaViewer } from './SchemaViewer'

afterEach(cleanup)

describe('SchemaViewer tree', () => {
  it('allows the model section to be resized, collapsed, and expanded', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: { id: { type: 'integer' } },
    }

    render(
      <SchemaViewer
        schema={schema}
        document={{} as OpenAPIV3.Document}
        label="Modelo esperado"
        collapsible
        resizable
      />,
    )

    const viewer = screen.getByRole('region', { name: 'Modelo esperado' })
    expect(viewer.className).toContain('resize')

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar Modelo esperado' }))
    expect(screen.queryByText('id')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Modelo esperado' }))
    expect(screen.getByText('id')).toBeTruthy()
  })

  it('shows field metadata inside hierarchical, collapsible nodes', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          nullable: true,
          description: 'Datos del perfil',
          properties: {
            name: {
              type: 'string',
              nullable: false,
              description: 'Nombre visible',
            },
          },
        },
      },
      required: ['profile'],
    }

    render(
      <SchemaViewer schema={schema} document={{} as OpenAPIV3.Document} label="Modelo esperado" />,
    )

    const tree = screen.getByRole('tree', { name: 'Estructura de Modelo esperado' })
    expect(tree.className).toContain('overflow-x-auto')
    const viewer = screen.getByRole('region', { name: 'Modelo esperado' })
    expect(viewer.className).toContain('bg-slate-950')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('profile')).toBeTruthy()
    expect(screen.getByText('object')).toBeTruthy()
    expect(screen.getByText('Null')).toBeTruthy()
    expect(screen.getByText('Not Null')).toBeTruthy()
    expect(screen.getByText('Datos del perfil')).toBeTruthy()
    expect(screen.getByText('name')).toBeTruthy()
    expect(screen.getByText('Nombre visible')).toBeTruthy()
    expect(screen.getByText('name').closest('[role="group"]')?.className).toContain('ml-10')
    expect(screen.getByText('name').closest('[role="group"]')?.className).toContain('pl-8')
    expect(
      screen.getByText('profile').closest('[role="treeitem"]')?.firstElementChild?.className,
    ).not.toContain('border')
    expect(
      screen.getByText('profile').closest('[role="treeitem"]')?.firstElementChild?.className,
    ).toContain('bg-white/[0.025]')

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar campo profile' }))

    expect(screen.queryByText('name')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Expandir campo profile' }).getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('keeps object fields inside nested arrays expandable', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Elementos del resultado',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', description: 'Identificador' },
            },
          },
        },
      },
    }

    render(<SchemaViewer schema={schema} document={{} as OpenAPIV3.Document} />)

    expect(screen.getByText('array<object>')).toBeTruthy()
    expect(screen.getByText('id')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar campo items' }))

    expect(screen.queryByText('id')).toBeNull()
  })

  it('colors data types according to their semantic category', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        count: { type: 'integer', format: 'int64' },
        amount: { type: 'number', format: 'double' },
        createdAt: { type: 'string', format: 'date-time' },
        enabled: { type: 'boolean' },
      },
    }

    render(<SchemaViewer schema={schema} document={{} as OpenAPIV3.Document} />)

    expect(screen.getByText('string').className).toContain('text-emerald-300')
    expect(screen.getByText('integer (int64)').className).toContain('text-blue-300')
    expect(screen.getByText('number (double)').className).toContain('text-blue-300')
    expect(screen.getByText('string (date-time)').className).toContain('text-cyan-300')
    expect(screen.getByText('boolean').className).toContain('text-orange-300')
  })
})
