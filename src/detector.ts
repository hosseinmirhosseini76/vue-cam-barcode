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

export async function createDetector(
  formats?: BarcodeFormat[],
  custom?: DetectFn,
  wasmUrl?: string,
): Promise<DetectFn> {
  if (custom) return custom

  const wanted = wantedFormats(formats)

  if (await nativeSupports(wanted)) {
    const Native = (
      window as unknown as {
        BarcodeDetector: new (opts: { formats: string[] }) => DetectorLike
      }
    ).BarcodeDetector
    return wrap(new Native({ formats: wanted }))
  }

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
