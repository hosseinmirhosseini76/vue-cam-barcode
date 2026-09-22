import { describe, expect, it } from 'vitest'
import { advanceConfirm, emptyConfirmState } from '../src/confirm'

describe('advanceConfirm', () => {
  it('accepts immediately when needed is 1', () => {
    const { confirmed, state } = advanceConfirm(
      emptyConfirmState(),
      'ean:123',
      1,
      1000,
    )
    expect(confirmed).toBe(true)
    expect(state).toEqual({ key: 'ean:123', count: 1, lastAt: 1000 })
  })

  it('confirms after enough hits in the window', () => {
    let state = emptyConfirmState()
    let confirmed = false

    ;({ state, confirmed } = advanceConfirm(state, 'ean:A', 2, 1000, 1200))
    expect(confirmed).toBe(false)
    expect(state.count).toBe(1)

    ;({ state, confirmed } = advanceConfirm(state, 'ean:A', 2, 1300, 1200))
    expect(confirmed).toBe(true)
    expect(state.count).toBe(2)
  })

  it('keeps progress across gaps inside the window', () => {
    let state = emptyConfirmState()
    ;({ state } = advanceConfirm(state, 'ean:A', 3, 1000, 1200))
    // Simulate empty frames (no advanceConfirm calls) then another hit
    const next = advanceConfirm(state, 'ean:A', 3, 1800, 1200)
    expect(next.confirmed).toBe(false)
    expect(next.state.count).toBe(2)
  })

  it('resets when the window expires', () => {
    let state = emptyConfirmState()
    ;({ state } = advanceConfirm(state, 'ean:A', 3, 1000, 500))
    const next = advanceConfirm(state, 'ean:A', 3, 1600, 500)
    expect(next.confirmed).toBe(false)
    expect(next.state).toEqual({ key: 'ean:A', count: 1, lastAt: 1600 })
  })

  it('resets when the value changes', () => {
    let state = emptyConfirmState()
    ;({ state } = advanceConfirm(state, 'ean:A', 3, 1000, 1200))
    ;({ state } = advanceConfirm(state, 'ean:A', 3, 1100, 1200))
    const next = advanceConfirm(state, 'ean:B', 3, 1200, 1200)
    expect(next.confirmed).toBe(false)
    expect(next.state).toEqual({ key: 'ean:B', count: 1, lastAt: 1200 })
  })
})
