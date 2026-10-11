import { mergeConfig } from 'vite';
import base from './vite.config.ts';
export default mergeConfig(base, {
    optimizeDeps: { entries: ['tests/browser/activities.html'] },
    server: {
        port: 5206,
        watch: { ignored: ['**/vendor/**', '**/storage/**', '**/.git/**'] },
    },
});
