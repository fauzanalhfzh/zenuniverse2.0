import { useCallback, useEffect, useRef, useState } from 'react';
import { show as progressShow } from '@/routes/progress';
import type { ProgressSnapshot } from '@/types/lesson';
import { ApiClient } from './client';
import {
    isFreshSnapshot,
    PROGRESS_CHANNEL,
    shouldPoll,
    withJitter,
} from './sync';

export function useDashboardProgress(pollMs = 15_000) {
    const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const request = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        if (request.current) return;
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        setError(false);
        try {
            const snapshot = await new ApiClient().get<ProgressSnapshot>(
                progressShow.url(),
                { signal: controller.signal },
            );
            if (!controller.signal.aborted) {
                setProgress((current) =>
                    isFreshSnapshot(snapshot, current) ? snapshot : current,
                );
            }
        } catch {
            if (!controller.signal.aborted) setError(true);
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void refresh();
        const tick = () => {
            if (
                shouldPoll({
                    visible: document.visibilityState === 'visible',
                    online: navigator.onLine,
                    focused: document.hasFocus(),
                })
            ) {
                void refresh();
            }
        };
        const channel =
            typeof BroadcastChannel === 'undefined'
                ? null
                : new BroadcastChannel(PROGRESS_CHANNEL);
        if (channel) channel.onmessage = tick;
        const timer = window.setInterval(tick, withJitter(pollMs));
        window.addEventListener('focus', tick);
        window.addEventListener('online', tick);
        document.addEventListener('visibilitychange', tick);
        return () => {
            request.current?.abort();
            request.current = null;
            channel?.close();
            window.clearInterval(timer);
            window.removeEventListener('focus', tick);
            window.removeEventListener('online', tick);
            document.removeEventListener('visibilitychange', tick);
        };
    }, [refresh, pollMs]);

    return { progress, loading, error, refresh };
}
