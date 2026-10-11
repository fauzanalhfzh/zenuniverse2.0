import { mergeConfig } from 'vite';
import base from './vite.config.ts';

export default mergeConfig(base, {
    optimizeDeps: { entries: ['tests/browser/code-fill.html'] },
    server: {
        port: 5205,
        watch: { ignored: ['**/vendor/**', '**/storage/**', '**/.git/**'] },
    },
});
