import { defineConfig } from 'vite'
import path from 'path'
import * as glob from 'glob'

export default defineConfig({
  build: {
    outDir: 'build',
    rollupOptions: {
      input: glob.sync(path.resolve(__dirname, 'index.html')),
    },
  },
})
