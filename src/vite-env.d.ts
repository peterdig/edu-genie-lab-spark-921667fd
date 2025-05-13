/// <reference types="vite/client" />

declare module '@vitejs/plugin-react' {
  import type { Plugin } from 'vite';
  export default function react(options?: any): Plugin;
}

declare module '@vitejs/plugin-react-swc' {
  import type { Plugin } from 'vite';
  export default function reactSwc(options?: any): Plugin;
}
