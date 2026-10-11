import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import browserConfig from './vite.config.ts';

export default mergeConfig(
    browserConfig,
    defineConfig({
        resolve: {
            alias: {
                '@inertiajs/react': fileURLToPath(
                    new URL('./subscription-inertia.tsx', import.meta.url),
                ),
            },
        },
        server: {
            port: 5201,
            watch: { ignored: ['**/vendor/**', '**/storage/**', '**/.git/**'] },
        },
    }),
);
