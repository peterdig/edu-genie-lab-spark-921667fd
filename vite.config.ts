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
    },
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
  },
  define: {
    // Add React Router future flags to opt-in to v7 behavior
    __REACT_ROUTER_FUTURE_FLAGS: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
});
