import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Adds a Content-Security-Policy to production builds. Only same-origin scripts may run, the API is the only
 * extra network destination, and plugins/framing are blocked. Not applied to `vite dev`, which needs inline
 * scripts for hot reload. When hosting, also send `frame-ancestors 'none'` as an HTTP header (meta tags can't).
 */
function contentSecurityPolicy(apiBaseUrl) {
  const apiOrigin = new URL(apiBaseUrl).origin;
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'stockwise-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_BASE_URL || 'http://localhost:8080')],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      restoreMocks: true,
    },
  };
});
