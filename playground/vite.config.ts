import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

function serveZxingWasm(): Plugin {
  const require = createRequire(import.meta.url)
  const ponyfill = require.resolve('barcode-detector/ponyfill')
  const wasmPath = createRequire(ponyfill).resolve(
    'zxing-wasm/reader/zxing_reader.wasm',
  )
  return {
    name: 'serve-zxing-wasm',
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
  }
}

const playgroundRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: playgroundRoot,
  plugins: [vue(), basicSsl(), serveZxingWasm()],
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
  optimizeDeps: {
    include: ['barcode-detector/ponyfill'],
  },
})
