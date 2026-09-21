/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetector
  getSupportedFormats?: () => Promise<string[]>
}

interface Window {
  BarcodeDetector: BarcodeDetectorConstructor
}

interface MediaTrackCapabilitySet {
  torch?: boolean
}
