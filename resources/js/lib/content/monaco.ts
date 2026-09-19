import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

let configured = false;

/**
 * Points @monaco-editor/react at the bundled monaco build and a local editor
 * worker so the editor works without reaching a CDN.
 */
export function setupMonaco(): void {
    if (configured || typeof window === 'undefined') {
        return;
    }

    (self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
        getWorker: () => new editorWorker(),
    };

    loader.config({ monaco });
    configured = true;
}
