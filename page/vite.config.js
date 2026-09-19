import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import pluginConfig from './plugin.config.js';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: pluginConfig.name,
      filename: 'remoteEntry.js',
      exposes: {
        './Plugin': './src/Plugin.vue',
        './Locales': './src/locales/index.js',
      },
      shared: ['vue'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    outDir: `dist/${pluginConfig.name}`,
  },
});
