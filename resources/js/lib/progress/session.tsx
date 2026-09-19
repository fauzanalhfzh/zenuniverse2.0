import { usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { ApiClient, ApiError } from './client';
import { ProgressOutbox, type OutboxJob, type SendResult } from './outbox';
import {
    isFreshSnapshot,
    notifyProgress,
    PROGRESS_CHANNEL,
    shouldPoll,
    withJitter,
} from './sync';
import type {
    AttemptResult,
    ProgressSnapshot,
    StepAttemptInput,
} from '@/types/lesson';

interface AuthPageProps {
    auth?: { user?: { id: number } | null };
    progressPollMs?: number;
    [key: string]: unknown;
}

interface ProgressSessionValue {
    progress: ProgressSnapshot | null;
    refresh: () => Promise<void>;
    submit: (input: StepAttemptInput) => Promise<AttemptResult>;
    completeLesson: (
        lessonId: string,
        contentRevision: number,
    ) => Promise<void>;
    flush: () => Promise<void>;
    pendingCount: number;
}

const ProgressSessionContext = createContext<ProgressSessionValue | null>(null);

const DEFAULT_POLL_MS = 15_000;

export function ProgressSessionProvider({
    children,
    initialProgress = null,
}: {
    children: ReactNode;
    initialProgress?: ProgressSnapshot | null;
}) {
    const page = usePage<AuthPageProps>();
    const userId = page.props.auth?.user?.id ?? null;
    const pollMs = page.props.progressPollMs ?? DEFAULT_POLL_MS;
    const api = useRef(new ApiClient());
    const inFlight = useRef(false);
    const channel = useRef<BroadcastChannel | null>(null);
    const [progress, setProgress] = useState<ProgressSnapshot | null>(
        initialProgress,
    );
    const [pendingCount, setPendingCount] = useState(0);

    const outbox = useMemo(
        () => (userId === null ? null : new ProgressOutbox(userId)),
        [userId],
    );

    const applySnapshot = useCallback((snapshot: ProgressSnapshot) => {
        setProgress((current) =>
            isFreshSnapshot(snapshot, current) ? snapshot : current,
        );
    }, []);

    const refresh = useCallback(async () => {
        if (inFlight.current) {
            return;
        }

        inFlight.current = true;

        try {
            applySnapshot(
                await api.current.get<ProgressSnapshot>('/me/progress'),
            );
        } catch {
            // Snapshot terakhir tetap dipakai; polling berikutnya mencoba lagi.
        } finally {
            inFlight.current = false;
        }
    }, [applySnapshot]);

    const flush = useCallback(async () => {
        if (!outbox) {
            return;
        }

        setPendingCount(outbox.size());

        await outbox.flush(async (job: OutboxJob): Promise<SendResult> => {
            try {
                await api.current.post(job.url, job.body);

                return 'ok';
            } catch (error) {
                if (error instanceof ApiError) {
                    if (
                        error.status === 419 ||
                        error.status === 429 ||
                        error.status >= 500
                    ) {
                        return 'retry';
                    }

                    return 'drop';
                }

                return 'retry';
            }
        });

        setPendingCount(outbox.size());
    }, [outbox]);

    const submit = useCallback(
        async (input: StepAttemptInput): Promise<AttemptResult> => {
            try {
                const result = await api.current.post<AttemptResult>(
                    '/learning/attempts',
                    input,
                );
                applySnapshot(result.progress);
                notifyProgress(channel.current, result.progress.updatedAt ?? 0);

                return result;
            } catch (error) {
                if (
                    outbox &&
                    (!(error instanceof ApiError) ||
                        error.status === 419 ||
                        error.status === 429 ||
                        error.status >= 500)
                ) {
                    outbox.enqueue({
                        id: input.attempt_id,
                        url: '/learning/attempts',
                        body: input,
                    });
                    setPendingCount(outbox.size());
                }

                throw error;
            }
        },
        [outbox, applySnapshot],
    );

    const completeLesson = useCallback(
        async (lessonId: string, contentRevision: number) => {
            const result = await api.current.post<{
                progress: ProgressSnapshot;
            }>(`/learning/lessons/${lessonId}/complete`, {
                content_revision: contentRevision,
            });
            applySnapshot(result.progress);
            notifyProgress(channel.current, result.progress.updatedAt ?? 0);
        },
        [applySnapshot],
    );

    // Initial load + cross-tab invalidation via BroadcastChannel.
    useEffect(() => {
        if (
            userId === null ||
            typeof window === 'undefined' ||
            typeof BroadcastChannel === 'undefined'
        ) {
            return;
        }

        const bus = new BroadcastChannel(PROGRESS_CHANNEL);
        bus.onmessage = () => void refresh();
        channel.current = bus;

        return () => {
            bus.close();
            channel.current = null;
        };
    }, [userId, refresh]);

    useEffect(() => {
        if (userId === null) {
            return;
        }

        void refresh();
        void flush();
    }, [userId, refresh, flush]);

    // Polling + refetch saat tab kembali terlihat/fokus/online.
    useEffect(() => {
        if (userId === null || typeof window === 'undefined') {
            return;
        }

        const tick = (): void => {
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

        const timer = window.setInterval(tick, withJitter(pollMs));
        const onVisible = (): void => tick();
        const onFocus = (): void => tick();
        const onOnline = (): void => {
            void flush();
            tick();
        };

        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onFocus);
        window.addEventListener('online', onOnline);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('online', onOnline);
        };
    }, [userId, pollMs, refresh, flush]);

    const value = useMemo(
        () => ({
            progress,
            refresh,
            submit,
            completeLesson,
            flush,
            pendingCount,
        }),
        [progress, refresh, submit, completeLesson, flush, pendingCount],
    );

    return (
        <ProgressSessionContext.Provider value={value}>
            {children}
        </ProgressSessionContext.Provider>
    );
}

export function useProgressSession(): ProgressSessionValue {
    const context = useContext(ProgressSessionContext);

    if (context === null) {
        throw new Error(
            'useProgressSession must be used within <ProgressSessionProvider>',
        );
    }

    return context;
}
