import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html',
        register: 'src/register.html',
        farmer: 'src/farmer-dashboard.html',
        member: 'src/member-dashboard.html',
        marketplace: 'src/marketplace.html',
        farmDetail: 'src/farm-detail.html'
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
