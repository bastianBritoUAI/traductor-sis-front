// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setEnvironment, type EnvironmentConfig } from '../config/env'
import { useApiSelectionStore } from '../store/apiSelectionStore'
import { ApiSelector } from './ApiSelector'

const environment: EnvironmentConfig = {
  azureAdInstance: 'https://login.microsoftonline.com',
  azureAdClientId: 'client-id',
  azureAdTenantId: 'tenant-id',
  defaultApiId: 'traductor',
  apis: [
    {
      id: 'traductor',
      name: 'Traductor SIS',
      baseUrl: 'https://api.example.test/traductor',
      openApiUrl: 'https://traductor-docs.example.test/swagger/v1/swagger.json',
    },
    {
      id: 'reglamento',
      name: 'Reglamento SIS',
      baseUrl: 'https://api.example.test/reglamento',
      openApiUrl: 'https://reglamento-docs.example.test/swagger/v1/swagger.json',
    },
  ],
}

beforeEach(() => {
  setEnvironment(environment)
  useApiSelectionStore.getState().initialize(environment.defaultApiId)
})

afterEach(cleanup)

describe('ApiSelector', () => {
  it('opens the Swagger UI from the selected OpenAPI URL in another tab', () => {
    render(<ApiSelector />)

    const initialLink = screen.getByRole('link', {
      name: 'Abrir Swagger de Traductor SIS en otra pestaña',
    })
    expect(initialLink.getAttribute('href')).toBe(
      'https://traductor-docs.example.test/swagger/index.html',
    )
    expect(initialLink.getAttribute('target')).toBe('_blank')
    expect(initialLink.getAttribute('rel')).toBe('noopener noreferrer')

    fireEvent.change(screen.getByRole('combobox', { name: 'Seleccionar API' }), {
      target: { value: 'reglamento' },
    })

    expect(
      screen
        .getByRole('link', { name: 'Abrir Swagger de Reglamento SIS en otra pestaña' })
        .getAttribute('href'),
    ).toBe('https://reglamento-docs.example.test/swagger/index.html')
  })
})
