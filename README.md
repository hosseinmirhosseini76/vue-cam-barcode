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

Props: `formats`, `autoStart`, `once`, `multiple`, `cooldownMs`, `confirmCount` (default **3**), `confirmWindowMs`, `requireValidChecksum` (default **true**, EAN/UPC), `uniqueNearDistance` (default **3** in multiple — drops blurry near-miss EANs), `scanRegion`, `preferNative`. Events: `@detect`, `@candidate`, `@complete`, `@error`, `@engine`.

Hold the code steady until it is confirmed on several frames. Blurry frames often invent *different* but checksum-valid EANs; confirmation + near-duplicate filtering drops those.

## Demo

Local playground / static demo build:

```bash
pnpm dev          # https playground on :5174
pnpm build:demo   # static site → demo-dist/
```

## Author

[S.Hossein Mirhosseini](https://github.com/hosseinmirhosseini76)

## Links

- GitHub: https://github.com/hosseinmirhosseini76/vue-cam-barcode
- npm: https://www.npmjs.com/package/vue-cam-barcode

## License

MIT

## Dev

```bash
pnpm install
pnpm test
pnpm dev          # playground on :5174 — open from your phone (HTTPS)
pnpm build        # library
pnpm build:demo   # demo site → demo-dist/
```
