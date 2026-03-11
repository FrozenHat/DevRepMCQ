import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',

    server: {
        port: 5173,
        // Proxies /api/* to the local Node.js backend during development.
        // In production, Nginx handles routing; this proxy is dev-only.
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },

    build: {
        outDir: 'dist',
        // Keep assets readable in ci; hashing handled by Vite defaults
        assetsInlineLimit: 0,
    },

    // Resolve JSON imports (used by ApiClient for local quest/scene data)
    assetsInclude: [],
});
