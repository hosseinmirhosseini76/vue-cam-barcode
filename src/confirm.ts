export interface ConfirmState {
  key: string
  count: number
  lastAt: number
}

/**
 * Time-window confirmation: same key must be seen `needed` times within `windowMs`.
 * Missed / empty frames do NOT reset the counter (important for weak cameras).
 */
export function advanceConfirm(
  state: ConfirmState,
  key: string,
  needed: number,
  now = Date.now(),
  windowMs = 1000,
): { state: ConfirmState; confirmed: boolean } {
  if (needed <= 1) {
    return { state: { key, count: 1, lastAt: now }, confirmed: true }
  }

  const stale = !state.key || now - state.lastAt > windowMs
  if (stale || key !== state.key) {
    return { state: { key, count: 1, lastAt: now }, confirmed: false }
  }

  const count = state.count + 1
  return {
    state: { key, count, lastAt: now },
    confirmed: count >= needed,
  }
}

export function emptyConfirmState(): ConfirmState {
  return { key: '', count: 0, lastAt: 0 }
}
