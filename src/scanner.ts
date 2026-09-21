import { openRearCamera, stopStream } from './camera'
import { createDetector } from './detector'
import { parseBarcode } from './parse'
import type { BarcodeScanResult, DetectFn, ScannerOptions } from './types'

export class CameraBarcodeScanner {
  private stream: MediaStream | null = null
  private running = false
  private raf = 0
  private vfc = 0
  private busy = false
  private lastKey = ''
  private lastAt = 0
  private detectFn: DetectFn | null = null

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly options: ScannerOptions = {},
  ) {}

  get mediaStream(): MediaStream | null {
    return this.stream
  }

  async start(): Promise<void> {
    if (this.running) return
    this.detectFn = await createDetector(
      this.options.formats,
      this.options.detect,
      this.options.wasmUrl,
    )
    this.stream = await openRearCamera(this.video, this.options.constraints)
    this.running = true
    this.tick()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
    const video = this.video as HTMLVideoElement & {
      cancelVideoFrameCallback?: (id: number) => void
    }
    video.cancelVideoFrameCallback?.(this.vfc)
    stopStream(this.stream)
    this.stream = null
    this.video.srcObject = null
  }

  private tick = (): void => {
    if (!this.running) return
    void this.scan()
    const video = this.video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number
    }
    if (video.requestVideoFrameCallback) {
      this.vfc = video.requestVideoFrameCallback(this.tick)
    } else {
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  private async scan(): Promise<void> {
    if (this.busy || !this.detectFn || this.video.readyState < 2) return
    this.busy = true
    try {
      const codes = await this.detectFn(this.video)
      const code = codes.find((item) => item.rawValue)
      if (!code) return

      const cooldown = this.options.cooldownMs ?? 1200
      const key = `${code.format}:${code.rawValue}`
      const now = Date.now()
      if (key === this.lastKey && now - this.lastAt < cooldown) return
      this.lastKey = key
      this.lastAt = now

      const result: BarcodeScanResult = {
        rawValue: code.rawValue,
        format: code.format,
        timestamp: now,
        parsed: parseBarcode(code.rawValue, code.format),
      }
      this.options.onDetect?.(result)
      if (this.options.once) this.stop()
    } catch {
      // empty / undecodable frames are normal
    } finally {
      this.busy = false
    }
  }
}
