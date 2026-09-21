import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      insertTypesEntry: true,
      rollupTypes: true,
      exclude: ['playground', 'tests', 'src/env.d.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueCamBarcode',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', /^barcode-detector/],
    },
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    emptyOutDir: true,
  },
})
