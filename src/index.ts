export { default as BarcodeScanner } from './BarcodeScanner.vue'
export { useBarcodeScanner } from './useBarcodeScanner'
export { CameraBarcodeScanner } from './scanner'
export { parseBarcode, isValidGtin, expandUpcE } from './parse'
export { advanceConfirm, emptyConfirmState } from './confirm'
export {
  isCameraSupported,
  isBarcodeDetectorSupported,
  openRearCamera,
  stopStream,
  hasTorch,
  setTorch,
} from './camera'
export { PRODUCT_BARCODE_FORMATS, BarcodeScannerError } from './types'
export type {
  BarcodeFormat,
  BarcodeKind,
  BarcodeScanResult,
  DetectedCode,
  DetectFn,
  ParsedBarcode,
  ScannerOptions,
} from './types'
export type { ConfirmState } from './confirm'
export type { DetectorEngine } from './detector'
export { hammingDistance, isNearDuplicateGtin } from './near'
