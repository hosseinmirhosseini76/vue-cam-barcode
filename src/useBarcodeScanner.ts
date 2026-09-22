import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue'
import { hasTorch, isCameraSupported, setTorch } from './camera'
import { CameraBarcodeScanner } from './scanner'
import { BarcodeScannerError, type BarcodeScanResult, type ScannerOptions } from './types'

export function useBarcodeScanner(
  video: Ref<HTMLVideoElement | null>,
  options: ScannerOptions = {},
) {
  const scanning = ref(false)
  const torchOn = ref(false)
  const torchAvailable = ref(false)
  const lastResult = shallowRef<BarcodeScanResult | null>(null)
  const error = shallowRef<Error | null>(null)
  const engine = shallowRef<'native' | 'wasm' | null>(null)
  let scanner: CameraBarcodeScanner | null = null

  const supported = isCameraSupported()

  async function start(): Promise<void> {
    const el = video.value
    if (!el) {
      error.value = new BarcodeScannerError('no-video', 'Video element is not ready.')
      return
    }
    stop()
    error.value = null
    engine.value = null
    scanner = new CameraBarcodeScanner(el, {
      ...options,
      onDetect: (result) => {
        lastResult.value = result
        options.onDetect?.(result)
      },
      onCandidate: (result) => {
        options.onCandidate?.(result)
      },
      onEngine: (name) => {
        engine.value = name
        options.onEngine?.(name)
      },
      onError: (err) => {
        error.value = err
        options.onError?.(err)
      },
    })
    try {
      await scanner.start()
      scanning.value = true
      torchAvailable.value = hasTorch(scanner.mediaStream)
    } catch (err) {
      scanning.value = false
      error.value = err instanceof Error ? err : new Error(String(err))
      options.onError?.(error.value)
    }
  }

  function stop(): void {
    scanner?.stop()
    scanner = null
    scanning.value = false
    torchOn.value = false
    torchAvailable.value = false
  }

  async function toggleTorch(): Promise<void> {
    const next = !torchOn.value
    const ok = await setTorch(scanner?.mediaStream ?? null, next)
    if (ok) torchOn.value = next
  }

  onBeforeUnmount(stop)

  return {
    supported,
    scanning,
    error,
    engine,
    lastResult,
    torchOn,
    torchAvailable,
    start,
    stop,
    toggleTorch,
  }
}
