import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      // Configure multiple entry points for the build
      // This ensures both index.html and embedded.html are included in the dist folder
      // when running 'yarn build', making them available in 'yarn preview' mode
      input: {
        main: resolve(__dirname, 'index.html'),
        embedded: resolve(__dirname, 'embedded.html'),
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ["localhost"],
    hmr: {
      host: "localhost",
    },
  },
}); 