<script setup lang="ts">
import { ref } from 'vue'
import { BarcodeScanner, type BarcodeScanResult } from 'vue-cam-barcode'
import { version as PACKAGE_VERSION } from '../package.json'

const GITHUB = 'https://github.com/hosseinmirhosseini76/vue-cam-barcode'
const NPM = 'https://www.npmjs.com/package/vue-cam-barcode'
const AUTHOR = 'S.Hossein Mirhosseini'
const AUTHOR_URL = 'https://github.com/hosseinmirhosseini76'
const WASM_URL = `${import.meta.env.BASE_URL}zxing_reader.wasm`
const VERSION = PACKAGE_VERSION

const scanner = ref<{ start: () => Promise<void>; finish: () => void } | null>(null)
const lastValue = ref<string | null>(null)
const codes = ref<string[]>([])
const error = ref<string | null>(null)
const started = ref(false)

function onDetect(payload: BarcodeScanResult) {
  lastValue.value = payload.parsed.value || payload.rawValue
}

function onComplete(values: string[]) {
  codes.value = values
  started.value = false
}

function onError(err: Error) {
  error.value = err.message
}

async function startCamera() {
  error.value = null
  lastValue.value = null
  codes.value = []
  started.value = true
  await scanner.value?.start()
}
</script>

<template>
  <div class="demo">
    <header class="demo__hero">
      <p class="demo__mark">Vue 3 · v{{ VERSION }}</p>
      <h1 class="demo__brand">vue-cam-barcode</h1>
      <p class="demo__lead">
        اسکنر دوربین برای بارکد خطی و QR — موبایل و تبلت
      </p>
    </header>

    <section class="demo__stage" aria-label="اسکنر">
      <BarcodeScanner
        ref="scanner"
        :auto-start="false"
        multiple
        :wasm-url="WASM_URL"
        @detect="onDetect"
        @complete="onComplete"
        @error="onError"
      />

      <button
        v-if="!started"
        type="button"
        class="demo__cta"
        @click="startCamera"
      >
        شروع دوربین
      </button>

      <p v-if="error" class="demo__error">{{ error }}</p>
      <p v-else-if="lastValue" class="demo__last">
        آخرین خوانده‌شده: <span>{{ lastValue }}</span>
      </p>
      <p v-else class="demo__hint">
        بارکد را ثابت داخل قاب نگه دارید تا تأیید شود.
      </p>
    </section>

    <section v-if="codes.length" class="demo__results" aria-label="نتایج">
      <h2>کدهای خوانده‌شده</h2>
      <ol>
        <li v-for="(code, i) in codes" :key="`${code}-${i}`">{{ code }}</li>
      </ol>
    </section>

    <footer class="demo__footer">
      <nav class="demo__links" aria-label="لینک‌های پروژه">
        <a :href="GITHUB" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a :href="NPM" target="_blank" rel="noopener noreferrer">npm</a>
      </nav>
      <p class="demo__author">
        ساخته‌شده توسط
        <a :href="AUTHOR_URL" target="_blank" rel="noopener noreferrer">{{ AUTHOR }}</a>
        · v{{ VERSION }}
      </p>
    </footer>
  </div>
</template>

<style>
:root {
  --demo-bg0: #07140c;
  --demo-bg1: #0c1f14;
  --demo-ink: #ecfdf3;
  --demo-muted: #9cb4a6;
  --demo-accent: #22c55e;
  --demo-accent-ink: #052e16;
  --demo-line: rgb(34 197 94 / 0.22);
  --demo-glow: rgb(34 197 94 / 0.18);
  --font-display: "Syne", "Vazirmatn", sans-serif;
  --font-body: "Vazirmatn", "Syne", sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: var(--font-body);
  color: var(--demo-ink);
  background:
    radial-gradient(ellipse 90% 55% at 50% -10%, var(--demo-glow), transparent 55%),
    radial-gradient(ellipse 70% 40% at 100% 100%, rgb(34 197 94 / 0.08), transparent 45%),
    linear-gradient(165deg, var(--demo-bg1), var(--demo-bg0) 55%, #050d09);
}

.demo {
  width: min(100%, 28rem);
  margin: 0 auto;
  padding: 1.5rem 1rem 2.5rem;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.demo__hero {
  text-align: center;
  padding-top: 0.35rem;
}

.demo__mark {
  margin: 0 0 0.4rem;
  font: 600 0.72rem/1 var(--font-display);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--demo-accent);
}

.demo__brand {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(1.85rem, 7vw, 2.45rem);
  letter-spacing: -0.04em;
  line-height: 1.05;
  direction: ltr;
  unicode-bidi: isolate;
}

.demo__lead {
  margin: 0.7rem 0 0;
  color: var(--demo-muted);
  font-size: 0.95rem;
  line-height: 1.55;
}

.demo__stage {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.demo__cta {
  appearance: none;
  border: 0;
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  background: var(--demo-accent);
  color: var(--demo-accent-ink);
  font: 700 1rem/1.2 var(--font-body);
  cursor: pointer;
  box-shadow: 0 10px 30px rgb(34 197 94 / 0.25);
}

.demo__cta:active {
  transform: translateY(1px);
}

.demo__hint,
.demo__last,
.demo__error {
  margin: 0;
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.45;
}

.demo__hint {
  color: var(--demo-muted);
}

.demo__last {
  color: var(--demo-ink);
}

.demo__last span {
  color: var(--demo-accent);
  font-weight: 700;
  direction: ltr;
  unicode-bidi: isolate;
}

.demo__error {
  color: #fb7185;
  font-weight: 600;
}

.demo__results {
  border-top: 1px solid var(--demo-line);
  padding-top: 1rem;
}

.demo__results h2 {
  margin: 0 0 0.65rem;
  font: 700 0.95rem/1.2 var(--font-display);
}

.demo__results ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.demo__results li {
  direction: ltr;
  text-align: left;
  font: 600 0.9rem/1.35 ui-monospace, "Cascadia Code", monospace;
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  background: rgb(255 255 255 / 0.04);
  border: 1px solid var(--demo-line);
  word-break: break-all;
}

.demo__footer {
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid var(--demo-line);
  text-align: center;
  display: grid;
  gap: 0.75rem;
}

.demo__links {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
}

.demo__links a,
.demo__author a {
  color: var(--demo-accent);
  text-decoration: none;
  font-weight: 700;
}

.demo__links a:hover,
.demo__author a:hover {
  text-decoration: underline;
}

.demo__author {
  margin: 0;
  color: var(--demo-muted);
  font-size: 0.85rem;
}
</style>
