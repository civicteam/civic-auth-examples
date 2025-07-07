import { defineConfig } from 'vite';


export default defineConfig({
  root: '.',
  server: {
    host: true,
    allowedHosts: ["localhost", "civictester.com", "127.0.0.1"],
    hmr: {
      host: "localhost",
    },
  },
}); 