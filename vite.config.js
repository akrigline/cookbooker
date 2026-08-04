import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Static hosts like GitHub Pages serve 404.html for any unmatched path, so
// copying the built index.html there lets the client-side router pick up
// deep links and hard refreshes on non-root routes instead of a bare 404.
function spaFallback404() {
  let outDir = 'dist'
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Served from the custom domain cookbooker.akrigline.com (see public/CNAME),
  // the domain root — not a GitHub Pages project subpath.
  base: '/',
  plugins: [vue(), spaFallback404()],
})
