import { openRearCamera, stopStream } from './camera'
import { advanceConfirm, emptyConfirmState, type ConfirmState } from './confirm'
import { createDetector } from './detector'
import { isNearDuplicateGtin } from './near'
import { parseBarcode } from './parse'
import { coverFrameCrop } from './region'
import type { BarcodeScanResult, DetectFn, ScannerOptions } from './types'

function isProductFormat(format: string): boolean {
  const f = format.toLowerCase().replace(/-/g, '_')
  return f.includes('ean') || f.includes('upc')
}

export class CameraBarcodeScanner {
  private stream: MediaStream | null = null
  private running = false
  private raf = 0
  private vfc = 0
  private busy = false
  private lastKey = ''
  private lastAt = 0
  private seen = new Set<string>()
  private confirm: ConfirmState = emptyConfirmState()
  private detectFn: DetectFn | null = null
  private canvas: HTMLCanvasElement | null = null

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly options: ScannerOptions = {},
  ) {}

  get mediaStream(): MediaStream | null {
    return this.stream
  }

  async start(): Promise<void> {
    if (this.running) return
    this.confirm = emptyConfirmState()
    this.lastKey = ''
    this.lastAt = 0
    this.seen.clear()
    const { detect, engine } = await createDetector(
      this.options.formats,
      this.options.detect,
      this.options.wasmUrl,
      this.options.preferNative === true,
    )
    this.detectFn = detect
    this.options.onEngine?.(engine)
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
    this.canvas = null
    this.confirm = emptyConfirmState()
    this.seen.clear()
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

  private source(): ImageBitmapSource {
    if (!this.options.scanRegion) return this.video

    const crop = coverFrameCrop(
      this.video.videoWidth,
      this.video.videoHeight,
      this.video.clientWidth,
      this.video.clientHeight,
    )
    if (!crop) return this.video

    if (!this.canvas) this.canvas = document.createElement('canvas')
    if (this.canvas.width !== crop.sw || this.canvas.height !== crop.sh) {
      this.canvas.width = crop.sw
      this.canvas.height = crop.sh
    }
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return this.video
    ctx.drawImage(
      this.video,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      crop.sw,
      crop.sh,
    )
    return this.canvas
  }

  private accept(code: { rawValue: string; format: string }, now: number): void {
    const parsed = parseBarcode(code.rawValue, code.format)
    const value = parsed.value || code.rawValue
    if (this.options.unique && value) {
      if (this.seen.has(value)) return
      const near = this.options.uniqueNearDistance ?? 3
      if (near > 0 && isNearDuplicateGtin(value, this.seen, near)) return
    }

    const key = `${code.format}:${code.rawValue}`
    const cooldown = this.options.cooldownMs ?? 1200
    if (key === this.lastKey && now - this.lastAt < cooldown) return

    this.lastKey = key
    this.lastAt = now
    this.confirm = emptyConfirmState()
    if (this.options.unique && value) this.seen.add(value)

    const result: BarcodeScanResult = {
      rawValue: code.rawValue,
      format: code.format,
      timestamp: now,
      parsed,
    }
    this.options.onDetect?.(result)
    if (this.options.once) this.stop()
  }

  private async scan(): Promise<void> {
    if (this.busy || !this.detectFn || this.video.readyState < 2) return
    this.busy = true
    try {
      const codes = await this.detectFn(this.source())
      const code = codes.find((item) => item.rawValue)
      if (!code) return

      const now = Date.now()
      const parsed = parseBarcode(code.rawValue, code.format)
      this.options.onCandidate?.({
        rawValue: code.rawValue,
        format: code.format,
        timestamp: now,
        parsed,
      })

      const requireChecksum = this.options.requireValidChecksum !== false
      if (
        requireChecksum &&
        isProductFormat(code.format) &&
        parsed.checksumValid === false
      ) {
        return
      }

      const needed = this.options.confirmCount ?? 3
      if (needed <= 1) {
        this.accept(code, now)
        return
      }

      const key = `${code.format}:${code.rawValue}`
      const { state, confirmed } = advanceConfirm(
        this.confirm,
        key,
        needed,
        now,
        this.options.confirmWindowMs ?? 2000,
      )
      this.confirm = state
      if (confirmed) this.accept(code, now)
    } catch {
      // undecodable frames / transient detector errors
    } finally {
      this.busy = false
    }
  }
}
