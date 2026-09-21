# vue-cam-barcode

Tiny Vue 3 barcode scanner. **Camera-only** (phone/tablet rear camera). Uses native `BarcodeDetector` when it supports the formats; otherwise the `barcode-detector` ponyfill (ZXing WASM).

## Install

```bash
npm i vue-cam-barcode
```

Peer: `vue@^3.3`. Needs **HTTPS** (or localhost). WASM fallback is loaded on first scan if the browser cannot decode EAN/UPC natively (common on iPhone).

## Usage

```vue
<script setup>
import { BarcodeScanner } from 'vue-cam-barcode'

function onDetect(result) {
  console.log(result.parsed.value)
}
</script>

<template>
  <BarcodeScanner multiple @detect="onDetect" @complete="onComplete" />
</template>
```

`result.parsed.value` is the barcode string. With `multiple`, keep scanning until **Close camera**; `@complete` receives `string[]` of unique `parsed.value`s.

```ts
import { useBarcodeScanner, parseBarcode } from 'vue-cam-barcode'
```

Props: `formats`, `autoStart`, `once`, `multiple`, `cooldownMs`. Methods via template ref: `start`, `stop`, `finish`, `toggleTorch`.

## Author

[S.Hossein Mirhosseini](https://github.com/hosseinmirhosseini76)

## Repository

https://github.com/hosseinmirhosseini76/vue-cam-barcode

## License

MIT

## Dev

```bash
pnpm install
pnpm test
pnpm dev     # playground on :5174 — open from your phone (HTTPS)
pnpm build
```
