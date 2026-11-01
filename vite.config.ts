// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  // Vercel serves files in /public from its CDN alongside the Hono app.
  // Vite writes the compiled SPA there during the build.
  publicDir: false,
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/.shogo/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
    },
  },
  plugins: [
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    react(),
  ],
  build: {
    outDir: 'public',
    emptyOutDir: true,
    target: 'esnext',
    minify: true,
    assetsDir: 'assets',
  },
})
