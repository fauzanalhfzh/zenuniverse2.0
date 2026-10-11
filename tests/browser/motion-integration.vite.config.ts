import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import browserConfig from './vite.config.ts';

export default mergeConfig(
    browserConfig,
    defineConfig({
        optimizeDeps: { entries: ['tests/browser/motion-integration.html'] },
        resolve: {
            alias: {
                '@inertiajs/react': fileURLToPath(
                    new URL(
                        './motion-integration-inertia.tsx',
                        import.meta.url,
                    ),
                ),
            },
        },
        server: {
            port: 5204,
            watch: { ignored: ['**/vendor/**', '**/storage/**', '**/.git/**'] },
        },
    }),
);
