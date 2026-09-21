<script setup lang="ts">
import { ref } from 'vue'
import { BarcodeScanner, type BarcodeScanResult } from 'vue-cam-barcode'

const scanner = ref<{ start: () => Promise<void> } | null>(null)
const lastValue = ref<string | null>(null)
const codes = ref<string[]>([])

function onDetect(payload: BarcodeScanResult) {
  lastValue.value = payload.parsed.value
}

function onComplete(values: string[]) {
  codes.value = values
}
</script>

<template>
  <main class="page">
    <h1>خواندن بارکد محصول</h1>
    <p>آدرس <b>https://</b> شبکه را در گوشی باز کن. چند بارکد پشت‌سرهم بزن، بعد Close camera.</p>
    <BarcodeScanner
      ref="scanner"
      :auto-start="false"
      wasm-url="/zxing_reader.wasm"
      multiple
      @detect="onDetect"
      @complete="onComplete"
    />
    <button type="button" class="start" @click="scanner?.start()">شروع دوربین</button>
    <p v-if="lastValue" class="last">آخرین: {{ lastValue }}</p>
    <pre v-if="codes.length">{{ JSON.stringify(codes, null, 2) }}</pre>
  </main>
</template>

<style>
* { box-sizing: border-box }
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}
.page { padding: 1rem 1rem 2rem; max-width: 32rem; margin: 0 auto }
h1 { font-size: 1.25rem; margin: 0 0 .35rem }
p { margin: 0 0 1rem; opacity: .8 }
.last { margin-top: 1rem; opacity: 1; font-weight: 700 }
pre {
  margin-top: 1rem;
  padding: 0.85rem;
  border-radius: 0.75rem;
  background: #020617;
  overflow: auto;
  direction: ltr;
  text-align: left;
}
.start {
  display: block;
  width: 100%;
  max-width: 28rem;
  margin: 0.85rem auto 0;
  border: 0;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: #22c55e;
  color: #052e16;
  font: 700 1rem/1.2 system-ui, sans-serif;
}
</style>
