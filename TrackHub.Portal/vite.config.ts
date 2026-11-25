/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as { version: string };

export default defineConfig(({ mode }) => {
  // All REACT_APP_* reads are centralized in src/api/core/endpoints.ts, which keeps the CRA
  // process.env.REACT_APP_* convention so existing .env files and templates stay valid. This shim
  // statically replaces those references at build time. Skipped in test mode: tests assign
  // process.env.REACT_APP_* at runtime (endpoints.ts getters are lazy for that reason), which static
  // replacement would corrupt.
  // NODE_ENV reads elsewhere need no shim — Vite defines those natively.
  const isTest = mode === 'test';
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const envDefine = isTest
    ? {}
    : Object.fromEntries(
        Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
      );

  // Build stamp shown in the UI (src/constants/appVersion.ts). The build time makes two builds of the
  // SAME version distinguishable, which a deploy/rollback check needs. Defined in test mode too: they
  // are plain globals, not process.env references.
  const define = {
    ...envDefine,
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  };

  const https =
    fs.existsSync('cert.crt') && fs.existsSync('cert.key')
      ? { cert: fs.readFileSync('cert.crt'), key: fs.readFileSync('cert.key') }
      : undefined;

  return {
    plugins: [react()],
    resolve: {
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
