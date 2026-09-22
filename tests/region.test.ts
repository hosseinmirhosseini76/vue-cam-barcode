import { describe, expect, it } from 'vitest'
import { coverFrameCrop } from '../src/region'

describe('coverFrameCrop', () => {
  it('returns a centered crop inside the video', () => {
    // Same aspect: element 300x400, video 300x400 → simple inset
    const crop = coverFrameCrop(300, 400, 300, 400)
    expect(crop).toEqual({
      sx: Math.floor(300 * 0.22),
      sy: Math.floor(400 * 0.22),
      sw: Math.floor(300 * 0.56),
      sh: Math.floor(400 * 0.56),
    })
  })

  it('accounts for horizontal cover overflow', () => {
    // Wide video shown in tall element → sides cropped by cover
    const crop = coverFrameCrop(1920, 1080, 300, 400)
    expect(crop).not.toBeNull()
    expect(crop!.sx).toBeGreaterThan(0)
    expect(crop!.sx + crop!.sw).toBeLessThanOrEqual(1920)
    expect(crop!.sy).toBeGreaterThanOrEqual(0)
    expect(crop!.sy + crop!.sh).toBeLessThanOrEqual(1080)
  })
})
