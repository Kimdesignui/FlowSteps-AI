import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Tải các biến môi trường từ file .env hoặc môi trường hệ thống
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Cấu hình quan trọng để chạy trên GitHub Pages
    base: './', 
    
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    
    plugins: [react()],
    
    define: {
      // Chuyển đổi các biến môi trường để sử dụng trong code React qua process.env
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        // Thiết lập alias '@' để trỏ vào thư mục gốc của dự án
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    // Cấu hình build để đảm bảo đầu ra nằm trong thư mục 'dist' cho GitHub Actions
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});
