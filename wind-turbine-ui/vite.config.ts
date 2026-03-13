import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,      // تحديد المنفذ ليكون دائماً 5173
    strictPort: true, // إجبار Vite على عدم التبديل لمنفذ آخر إذا كان 5173 مشغولاً
    host: true       // اختياري: يسمح بالوصول للموقع عبر الشبكة المحلية (IP)
  }
})
