import { BarcodeScannerError } from './types'

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

async function getUserMedia(video: MediaTrackConstraints | boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: false, video })
}

/**
 * Open rear camera with progressive fallbacks for picky Android / iOS browsers.
 */
export async function openRearCamera(
  video: HTMLVideoElement,
  constraints?: MediaTrackConstraints,
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    const insecure =
      typeof window !== 'undefined' && window.isSecureContext === false
    throw new BarcodeScannerError(
      insecure ? 'insecure' : 'no-camera',
      insecure
        ? 'Camera needs HTTPS. Open the https:// URL from the terminal, then accept the certificate.'
        : 'Camera API is not available on this device.',
    )
  }

  const attempts: Array<MediaTrackConstraints | boolean> = [
    {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      ...constraints,
    },
    { facingMode: { ideal: 'environment' }, ...constraints },
    { facingMode: 'environment' },
    true,
  ]

  let stream: MediaStream | null = null
  let lastError: unknown

  for (const attempt of attempts) {
    try {
      stream = await getUserMedia(attempt)
      break
    } catch (error) {
      lastError = error
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        throw new BarcodeScannerError('permission', 'Camera permission was denied.')
      }
    }
  }

  if (!stream) {
    const name = lastError instanceof DOMException ? lastError.name : ''
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new BarcodeScannerError('no-camera', 'No camera was found.')
    }
    throw new BarcodeScannerError(
      'camera',
      lastError instanceof Error ? lastError.message : 'Could not open camera.',
    )
  }

  const track = stream.getVideoTracks()[0]
  if (track) {
    try {
      const caps = track.getCapabilities?.() as
        | { focusMode?: string[] }
        | undefined
      if (caps?.focusMode?.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }],
        } as unknown as MediaTrackConstraints)
      }
    } catch {
      // focusMode is best-effort
    }
  }

  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  video.setAttribute('muted', 'true')
  video.muted = true
  video.autoplay = true
  try {
    await video.play()
  } catch {
    // Autoplay can fail until a gesture; start() is already user-triggered.
  }
  return stream
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}

export function hasTorch(stream: MediaStream | null): boolean {
  const caps = stream?.getVideoTracks()[0]?.getCapabilities?.() as
    | { torch?: boolean }
    | undefined
  return !!caps?.torch
}

export async function setTorch(stream: MediaStream | null, on: boolean): Promise<boolean> {
  const track = stream?.getVideoTracks()[0]
  if (!track || !hasTorch(stream)) return false
  await track.applyConstraints({
    advanced: [{ torch: on }],
  } as unknown as MediaTrackConstraints)
  return true
}
