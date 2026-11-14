import { defineConfig } from 'vite';

// base './': all asset and data URLs are relative, so the build works under the GitHub Pages
// sub-path (https://<owner>.github.io/NASA-SpaceApp-26/) and at any other path.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
  test: { include: ['test/**/*.test.js'] },
});
