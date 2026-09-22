/** Matches `.dz-scan__frame { inset: 22% }` — center 56% of the visible element. */
const FRAME_INSET = 0.22

export interface VideoCropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Map the on-screen scan frame to source video pixels under `object-fit: cover`.
 * A naive % crop of videoWidth/Height does not match what the user sees.
 */
export function coverFrameCrop(
  videoWidth: number,
  videoHeight: number,
  elementWidth: number,
  elementHeight: number,
  inset = FRAME_INSET,
): VideoCropRect | null {
  if (!videoWidth || !videoHeight || !elementWidth || !elementHeight) return null

  const scale = Math.max(elementWidth / videoWidth, elementHeight / videoHeight)
  const displayedW = videoWidth * scale
  const displayedH = videoHeight * scale
  const offsetX = (displayedW - elementWidth) / 2
  const offsetY = (displayedH - elementHeight) / 2

  const frameLeft = elementWidth * inset
  const frameTop = elementHeight * inset
  const frameW = elementWidth * (1 - inset * 2)
  const frameH = elementHeight * (1 - inset * 2)

  let sx = (frameLeft + offsetX) / scale
  let sy = (frameTop + offsetY) / scale
  let sw = frameW / scale
  let sh = frameH / scale

  sx = Math.max(0, Math.min(videoWidth - 1, sx))
  sy = Math.max(0, Math.min(videoHeight - 1, sy))
  sw = Math.max(1, Math.min(videoWidth - sx, sw))
  sh = Math.max(1, Math.min(videoHeight - sy, sh))

  return {
    sx: Math.floor(sx),
    sy: Math.floor(sy),
    sw: Math.floor(sw),
    sh: Math.floor(sh),
  }
}
