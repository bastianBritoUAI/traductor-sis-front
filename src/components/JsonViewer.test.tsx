// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JsonViewer } from './JsonViewer'

describe('JsonViewer interactive tree', () => {
  it('collapses and expands object and array fields', () => {
    render(
      <JsonViewer
        value={{ profile: { name: 'Ada' }, items: [{ id: 1 }] }}
        label="Response body"
        collapsibleNodes
      />,
    )

    expect(screen.getByRole('button', { name: 'Colapsar campo items' })).toBeTruthy()
    expect(screen.getByText('"name"')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Colapsar campo profile' }))

    expect(screen.queryByText('"name"')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Expandir campo profile' }).getAttribute('aria-expanded'),
    ).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Expandir campo profile' }))

    expect(screen.getByText('"name"')).toBeTruthy()
  })
})
