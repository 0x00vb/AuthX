import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  minify: false,
  skipNodeModulesBundle: true,
  noExternal: ['dotenv'],
  external: ['fs', 'path', 'os', 'crypto'],
  esbuildOptions(options) {
    options.banner = {
      js: '#!/usr/bin/env node',
    };
    // Tell esbuild to bundle platform-specific packages differently
    options.platform = 'node';
    options.target = 'node14';
  },
}); 