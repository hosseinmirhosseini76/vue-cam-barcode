<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { injectScannerCss } from './injectCss'
import { useBarcodeScanner } from './useBarcodeScanner'
import type { BarcodeFormat, BarcodeScanResult, DetectFn } from './types'

const props = withDefaults(
  defineProps<{
    formats?: BarcodeFormat[]
    autoStart?: boolean
    once?: boolean
    multiple?: boolean
    cooldownMs?: number
    /** Same code hits needed inside confirmWindowMs. Default 3. */
    confirmCount?: number
    /** Window (ms) to accumulate confirm hits. Default 2000. */
    confirmWindowMs?: number
    /** Reject EAN/UPC with bad check digit. Default true. */
    requireValidChecksum?: boolean
    /** Decode only the center frame region. Default false. */
    scanRegion?: boolean
    /** Prefer native BarcodeDetector. Default false (WASM is more consistent). */
    preferNative?: boolean
    /**
     * When multiple: reject EANs within this Hamming distance of a seen code.
     * Default 3. Set 0 to disable.
     */
    uniqueNearDistance?: number
    detect?: DetectFn
    wasmUrl?: string
  }>(),
  {
    autoStart: true,
    once: false,
    multiple: false,
    cooldownMs: 1200,
    confirmCount: 3,
    confirmWindowMs: 2000,
    requireValidChecksum: true,
    scanRegion: false,
    preferNative: false,
    uniqueNearDistance: 3,
  },
)

const emit = defineEmits<{
  detect: [result: BarcodeScanResult]
  candidate: [result: BarcodeScanResult]
  complete: [values: string[]]
  error: [error: Error]
  engine: [engine: 'native' | 'wasm']
}>()

const video = ref<HTMLVideoElement | null>(null)
const values = ref<string[]>([])
const {
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
} = useBarcodeScanner(video, {
  get formats() {
    return props.formats
  },
  get once() {
    return props.multiple ? false : props.once
  },
  get unique() {
    return props.multiple
  },
  get uniqueNearDistance() {
    return props.uniqueNearDistance
  },
  get cooldownMs() {
    return props.cooldownMs
  },
  get confirmCount() {
    return props.confirmCount
  },
  get confirmWindowMs() {
    return props.confirmWindowMs
  },
  get requireValidChecksum() {
    return props.requireValidChecksum
  },
  get scanRegion() {
    return props.scanRegion
  },
  get preferNative() {
    return props.preferNative
  },
  get detect() {
    return props.detect
  },
  get wasmUrl() {
    return props.wasmUrl
  },
  onDetect: onDetected,
  onCandidate: (result) => emit('candidate', result),
  onEngine: (name) => emit('engine', name),
  onError: (err) => emit('error', err),
})

function barcodeValue(result: BarcodeScanResult): string {
  return result.parsed.value || result.rawValue
}

function onDetected(result: BarcodeScanResult): void {
  const value = barcodeValue(result)
  if (props.multiple) {
    if (!value || values.value.includes(value)) return
    values.value = [...values.value, value]
  }
  emit('detect', result)
}

async function begin(): Promise<void> {
  if (props.multiple) values.value = []
  await start()
}

function finish(): void {
  const list = [...values.value]
  stop()
  emit('complete', list)
}

onMounted(() => {
  injectScannerCss()
  if (props.autoStart) void begin()
})

defineExpose({
  start: begin,
  stop,
  finish,
  toggleTorch,
  scanning,
  lastResult,
  values,
  error,
  engine,
  supported,
})
</script>

<template>
  <div
    class="dz-scan"
    :class="{ 'dz-scan--multiple': multiple }"
    data-dz-barcode-scanner
  >
    <video ref="video" class="dz-scan__video" playsinline muted autoplay />
    <div class="dz-scan__mask" aria-hidden="true">
      <div class="dz-scan__frame" />
    </div>
    <span v-if="multiple && scanning" class="dz-scan__count">{{ values.length }}</span>
    <button
      v-if="torchAvailable"
      type="button"
      class="dz-scan__torch"
      :aria-pressed="torchOn"
      @click="toggleTorch"
    >
      {{ torchOn ? 'Torch off' : 'Torch' }}
    </button>
    <button
      v-if="multiple && scanning"
      type="button"
      class="dz-scan__done"
      @click="finish"
    >
      Close camera
    </button>
    <p v-if="error" class="dz-scan__error">{{ error.message }}</p>
    <p v-else-if="!supported" class="dz-scan__error">
      Camera needs a secure origin (HTTPS).
    </p>
    <slot
      :scanning="scanning"
      :result="lastResult"
      :values="values"
      :error="error"
      :engine="engine"
    />
  </div>
</template>
