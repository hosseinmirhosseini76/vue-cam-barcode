import type { BarcodeFormat as ZXingBarcodeFormat } from 'barcode-detector/ponyfill'
import {
  PRODUCT_BARCODE_FORMATS,
  type BarcodeFormat,
  type DetectFn,
} from './types'
import { isBarcodeDetectorSupported } from './camera'

type DetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>
}

export type DetectorEngine = 'native' | 'wasm'

function wantedFormats(formats?: BarcodeFormat[]): string[] {
  return (formats?.length ? formats : PRODUCT_BARCODE_FORMATS).map(String)
}

async function nativeSupports(formats: string[]): Promise<boolean> {
  if (!isBarcodeDetectorSupported()) return false
  const Native = (
    window as unknown as {
      BarcodeDetector: { getSupportedFormats?: () => Promise<string[]> }
    }
  ).BarcodeDetector
  try {
    const supported = Native.getSupportedFormats
      ? await Native.getSupportedFormats()
      : []
    // Empty list = unknown / unreliable — do not trust native.
    if (!supported.length) return false
    return formats.every((format) => supported.includes(format))
  } catch {
    return false
  }
}

function wrap(detector: DetectorLike): DetectFn {
  return async (source) => {
    const codes = await detector.detect(source)
    return codes
      .filter((code) => code.rawValue)
      .map((code) => ({ rawValue: code.rawValue, format: code.format }))
  }
}

async function createWasmDetector(
  wanted: string[],
  wasmUrl?: string,
): Promise<DetectFn> {
  const { BarcodeDetector, prepareZXingModule } = await import(
    'barcode-detector/ponyfill'
  )
  await prepareZXingModule({
    fireImmediately: true,
    ...(wasmUrl
      ? {
          overrides: {
            locateFile: (path: string, prefix: string) =>
              path.endsWith('.wasm') ? wasmUrl : `${prefix}${path}`,
          },
        }
      : {}),
  })
  return wrap(new BarcodeDetector({ formats: wanted as ZXingBarcodeFormat[] }))
}

function createNativeDetector(wanted: string[]): DetectFn {
  const Native = (
    window as unknown as {
      BarcodeDetector: new (opts: { formats: string[] }) => DetectorLike
    }
  ).BarcodeDetector
  return wrap(new Native({ formats: wanted }))
}

/**
 * Prefer WASM by default — Chrome's native BarcodeDetector varies a lot by phone
 * and often claims formats it cannot decode reliably.
 */
export async function createDetector(
  formats?: BarcodeFormat[],
  custom?: DetectFn,
  wasmUrl?: string,
  preferNative = false,
): Promise<{ detect: DetectFn; engine: DetectorEngine }> {
  if (custom) return { detect: custom, engine: 'wasm' }

  const wanted = wantedFormats(formats)

  if (preferNative && (await nativeSupports(wanted))) {
    try {
      return { detect: createNativeDetector(wanted), engine: 'native' }
    } catch {
      // fall through to wasm
    }
  }

  try {
    return { detect: await createWasmDetector(wanted, wasmUrl), engine: 'wasm' }
  } catch (wasmError) {
    if (!preferNative && (await nativeSupports(wanted))) {
      try {
        return { detect: createNativeDetector(wanted), engine: 'native' }
      } catch {
        // ignore
      }
    }
    throw wasmError
  }
}
