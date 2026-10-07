import { defineConfig, mergeConfig } from 'vite';
import browserConfig from './vite.config.ts';

export default mergeConfig(browserConfig, defineConfig({
    server: { watch: { ignored: ['**/vendor/**', '**/storage/**', '**/.git/**'] } },
}));
