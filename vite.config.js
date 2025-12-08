import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // Disable DevTools di production
    process.env.NODE_ENV === 'development' ? vueDevTools() : null,
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-charts': ['vue3-apexcharts', 'apexcharts'],
          'vendor-ui': ['sweetalert2', 'vue3-toastify'],
          'vendor-icons': ['@heroicons/vue'],
        }
      }
    },
    // ✅ GANTI: Pakai esbuild (default, lebih cepat dari terser)
    minify: 'esbuild',
    // Remove console.log di production
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'js-cookie'],
  }
})
