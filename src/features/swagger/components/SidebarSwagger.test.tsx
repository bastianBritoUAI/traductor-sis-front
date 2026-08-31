// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SwaggerEndpoint } from '../../../types/swagger'
import { SidebarSwagger } from './SidebarSwagger'

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
    id: 'roles-list',
    method: 'get',
    path: '/roles',
    summary: 'Listar roles',
    tags: ['Roles'],
    deprecated: false,
    parameters: [],
    responses: [],
  },
]

describe('SidebarSwagger', () => {
  it('starts with every endpoint group collapsed', () => {
    render(
      <SidebarSwagger endpoints={endpoints} apiTitle="API de prueba" apiVersion="1.0.0" />,
    )

    expect(screen.getByRole('button', { name: /^Usuarios/ }).getAttribute('aria-expanded')).toBe(
      'false',
    )
    expect(screen.getByRole('button', { name: /^Roles/ }).getAttribute('aria-expanded')).toBe(
      'false',
    )
    expect(screen.queryByText('Listar usuarios')).toBeNull()
    expect(screen.queryByText('Listar roles')).toBeNull()
  })
})
