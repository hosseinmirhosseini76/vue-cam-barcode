import { describe, expect, it } from 'vitest'
import { hammingDistance, isNearDuplicateGtin } from '../src/near'

describe('near duplicate GTIN', () => {
  it('measures hamming distance', () => {
    expect(hammingDistance('6264701071392', '6264701011398')).toBe(2)
    expect(hammingDistance('6264701071392', '7261701077392')).toBe(3)
    expect(hammingDistance('123', '12')).toBe(Number.POSITIVE_INFINITY)
  })

  it('flags misreads of the same EAN', () => {
    const seen = new Set(['6264701071392', '3023772267867'])
    expect(isNearDuplicateGtin('6264701011398', seen, 3)).toBe(true)
    expect(isNearDuplicateGtin('7261701077392', seen, 3)).toBe(true)
    expect(isNearDuplicateGtin('3223772267267', seen, 3)).toBe(true)
    expect(isNearDuplicateGtin('6260482520289', seen, 3)).toBe(false)
  })

  it('ignores non-numeric / QR values', () => {
    const seen = new Set(['https://example.com'])
    expect(isNearDuplicateGtin('https://example.com/x', seen, 3)).toBe(false)
  })
})
