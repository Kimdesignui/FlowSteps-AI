import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Phải có dòng này để tránh lỗi trắng trang
  build: {
    rollupOptions: {
      input: 'index.html', // Chỉ định file gốc là ở đây
    },
  },
});
