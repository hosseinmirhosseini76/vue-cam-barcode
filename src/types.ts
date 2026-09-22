export const PRODUCT_BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'itf',
  'qr_code',
  'data_matrix',
] as const

export type BarcodeFormat = (typeof PRODUCT_BARCODE_FORMATS)[number] | (string & {})

export type BarcodeKind = 'gtin' | 'code' | 'qr' | 'unknown'

export interface ParsedBarcode {
  kind: BarcodeKind
  value: string
  gtin?: string
  checksumValid?: boolean
  gs1Prefix?: string
  country?: string
  gs1?: Record<string, string>
}

export interface BarcodeScanResult {
  rawValue: string
  format: string
  timestamp: number
  parsed: ParsedBarcode
}

export interface DetectedCode {
  rawValue: string
  format: string
}

export type DetectFn = (source: ImageBitmapSource) => Promise<DetectedCode[]>

export interface ScannerOptions {
  formats?: BarcodeFormat[]
  once?: boolean
  /**
   * Never accept the same barcode value twice in one session (until start() again).
   * Used by multiple mode.
   */
  unique?: boolean
  /**
   * When `unique` is on, also reject GTIN/EAN values within this Hamming distance
   * of an already-accepted code (blurry misreads). Default 3. Set 0 to disable.
   */
  uniqueNearDistance?: number
  /** Ignore re-emitting the same code within this window (ms). Default 1200. */
  cooldownMs?: number
  /**
   * Same barcode must be seen this many times within `confirmWindowMs`.
   * Default 3. Set to 1 to accept the first decode.
   * Empty frames between hits do not reset the counter.
   */
  confirmCount?: number
  /** Time window (ms) for accumulating confirm hits. Default 2000. */
  confirmWindowMs?: number
  /**
   * Reject EAN/UPC with an invalid check digit.
   * Default true. QR / Code128 / Code39 are unaffected either way.
   */
  requireValidChecksum?: boolean
  /**
   * Only decode the center on-screen frame (object-fit:cover aware).
   * Default false.
   */
  scanRegion?: boolean
  constraints?: MediaTrackConstraints
  detect?: DetectFn
  wasmUrl?: string
  /**
   * Use Chrome native BarcodeDetector when it claims full format support.
   * Default false — WASM is more consistent across phones.
   */
  preferNative?: boolean
  onDetect?: (result: BarcodeScanResult) => void
  /** Fires on every decode attempt (before confirm). Useful for UI feedback. */
  onCandidate?: (result: BarcodeScanResult) => void
  onError?: (error: Error) => void
  /** Called once after detector is ready (native or wasm). */
  onEngine?: (engine: 'native' | 'wasm') => void
}

export class BarcodeScannerError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BarcodeScannerError'
    this.code = code
  }
}
