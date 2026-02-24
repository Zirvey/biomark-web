import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        register: resolve(__dirname, 'src/register.html'),
        farmer: resolve(__dirname, 'src/farmer-dashboard.html'),
        member: resolve(__dirname, 'src/member-dashboard.html'),
        farmDetail: resolve(__dirname, 'src/farm-detail.html'),
        checkout: resolve(__dirname, 'src/checkout.html')
      }
    }
  }
});
