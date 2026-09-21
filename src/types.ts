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
  cooldownMs?: number
  constraints?: MediaTrackConstraints
  detect?: DetectFn
  wasmUrl?: string
  onDetect?: (result: BarcodeScanResult) => void
  onError?: (error: Error) => void
}

export class BarcodeScannerError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BarcodeScannerError'
    this.code = code
  }
}
