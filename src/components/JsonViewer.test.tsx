// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { JsonViewer } from './JsonViewer'

afterEach(cleanup)

describe('JsonViewer interactive tree', () => {
  it('allows a resizable response body to be collapsed and expanded', () => {
    render(
      <JsonViewer value={{ status: 'ok' }} label="Response body" sectionCollapsible resizable />,
    )

    const details = screen.getByText('Response body').closest('details')

    expect(details?.open).toBe(true)
    expect(details?.querySelector('.resize')).toBeTruthy()

    fireEvent.click(details?.querySelector('summary') as HTMLElement)
    expect(details?.open).toBe(false)

    fireEvent.click(details?.querySelector('summary') as HTMLElement)
    expect(details?.open).toBe(true)
  })

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

  it('collapses and expands all JSON fields without hiding the viewer', () => {
    const { container } = render(
      <JsonViewer
        value={{ profile: { name: 'Ada' }, metadata: { id: 1 } }}
        collapsible
        collapsibleNodes
      />,
    )

    const collapse = screen.getByRole('button', { name: 'Colapsar campos JSON' })
    expect(container.textContent).toContain('"name"')

    fireEvent.click(collapse)

    expect(container.textContent).not.toContain('"name"')
    expect(container.textContent).toContain('"profile"')

    fireEvent.click(screen.getByRole('button', { name: 'Expandir campos JSON' }))

    expect(container.textContent).toContain('"name"')
  })
})
