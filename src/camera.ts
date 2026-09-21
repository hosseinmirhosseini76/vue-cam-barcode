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

  const videoConstraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    ...constraints,
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints,
    })
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new BarcodeScannerError('permission', 'Camera permission was denied.')
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new BarcodeScannerError('no-camera', 'No rear camera was found.')
    }
    throw new BarcodeScannerError(
      'camera',
      error instanceof Error ? error.message : 'Could not open camera.',
    )
  }

  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  video.setAttribute('muted', 'true')
  video.muted = true
  video.autoplay = true
  await video.play()
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
