import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: true,
    allowedHosts: ["localhost"],
    hmr: {
      host: "localhost",
    },
  },
}); 