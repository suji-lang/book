import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'highlight/index.js'),
      name: 'hljs',
      // Emit theme/highlight.js so mdBook picks it up as a theme override and
      // copies it into the built book itself — no post-build copy step needed.
      fileName: () => 'highlight.js',
      formats: ['iife']
    },
    outDir: 'theme',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: 'highlight.[ext]'
      }
    }
  }
});

