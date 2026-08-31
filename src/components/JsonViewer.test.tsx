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

  it('fills the height of its parent when requested', () => {
    const { container } = render(
      <JsonViewer value={{ status: 'ok' }} label="Ejemplo JSON" fillHeight />,
    )

    const viewer = container.firstElementChild
    const content = container.querySelector('pre')

    expect(viewer?.className).toContain('h-full')
    expect(viewer?.className).toContain('flex-col')
    expect(content?.className).toContain('flex-1')
    expect(content?.className).toContain('min-h-0')
    expect(content?.className).not.toContain('max-h-96')
  })
})
