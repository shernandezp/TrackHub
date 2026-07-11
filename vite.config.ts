/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

export default defineConfig(({ mode }) => {
  // Source still reads process.env.REACT_APP_* (CRA convention). Statically
  // replace those references at build time until the api layer centralizes
  // env access (migration spec 26, Phase 2). Skipped in test mode: tests
  // assign process.env.REACT_APP_* at runtime, which static replacement
  // would corrupt.
  const isTest = mode === 'test';
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const define = isTest
    ? {}
    : Object.fromEntries(
        Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
      );

  const https =
    fs.existsSync('cert.crt') && fs.existsSync('cert.key')
      ? { cert: fs.readFileSync('cert.crt'), key: fs.readFileSync('cert.key') }
      : undefined;

  return {
    plugins: [react()],
    resolve: {
      // Honors tsconfig "paths" (absolute imports rooted at src/)
      tsconfigPaths: true,
    },
    define,
    server: {
      port: 3000,
      // The OAuth callback is registered at https://localhost:3000/... —
      // fail loudly if the port is taken instead of drifting to 3001.
      strictPort: true,
      https,
    },
    build: {
      outDir: 'build',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/setupTests.ts'],
      include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    },
  };
});
