import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

function zxingWasmPath(): string {
  const require = createRequire(import.meta.url)
  const ponyfill = require.resolve('barcode-detector/ponyfill')
  return createRequire(ponyfill).resolve('zxing-wasm/reader/zxing_reader.wasm')
}

function serveAndCopyZxingWasm(outDir: string): Plugin {
  const wasmPath = zxingWasmPath()
  return {
    name: 'zxing-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/zxing_reader.wasm') {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/wasm')
        res.end(readFileSync(wasmPath))
      })
    },
    writeBundle() {
      mkdirSync(outDir, { recursive: true })
      copyFileSync(wasmPath, resolve(outDir, 'zxing_reader.wasm'))
    },
  }
}

const playgroundRoot = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(playgroundRoot, '../demo-dist')

export default defineConfig({
  root: playgroundRoot,
  base: process.env.DEMO_BASE || '/',
  plugins: [vue(), basicSsl(), serveAndCopyZxingWasm(outDir)],
  resolve: {
    alias: {
      'vue-cam-barcode': resolve(playgroundRoot, '../src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5174,
    https: {},
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['barcode-detector/ponyfill'],
  },
})
