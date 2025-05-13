import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add explicit aliases for common imported files with extensions
      "@/lib/NotificationContext": path.resolve(__dirname, "./src/lib/NotificationContext.tsx"),
      "@/lib/NotificationContext.tsx": path.resolve(__dirname, "./src/lib/NotificationContext.tsx"),
      "@/lib/NotificationContext.jsx": path.resolve(__dirname, "./src/lib/NotificationContext.jsx"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    host: "::",
    port: 8081,
    proxy: {
      // Proxy API requests to backend when in development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // Ensure environment variables are loaded
  envPrefix: "VITE_",
  // Enable better error output
  build: {
    sourcemap: true,
    // Improve CSS handling for arbitrary values
    cssTarget: 'chrome80',
  },
  define: {
    // Add React Router future flags to opt-in to v7 behavior
    __REACT_ROUTER_FUTURE_FLAGS: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
});
