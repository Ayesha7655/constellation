import { access, copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function copyLocalConfig(): Plugin {
  return {
    name: 'copy-local-extension-config',
    async closeBundle() {
      const root = import.meta.dirname;
      const localConfig = resolve(root, 'config.js');
      const exampleConfig = resolve(root, 'config.example.js');
      const source = await access(localConfig)
        .then(() => localConfig)
        .catch(() => exampleConfig);
      await mkdir(resolve(root, 'dist'), { recursive: true });
      await copyFile(source, resolve(root, 'dist/config.js'));
    },
  };
}

export default defineConfig({
  plugins: [react(), copyLocalConfig()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'popup.html'),
    },
  },
});
