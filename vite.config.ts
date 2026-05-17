import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

const nativeExternals = ['better-sqlite3']
const nodeExternals = ['electron', 'node:fs', 'node:fs/promises', 'node:path', 'node:url', 'node:crypto']

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: [...nodeExternals, ...nativeExternals],
              output: { format: 'es' },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            rollupOptions: {
              external: ['electron'],
              output: { format: 'cjs', entryFileNames: '[name].cjs' },
            },
          },
        },
      },
    }),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
})
