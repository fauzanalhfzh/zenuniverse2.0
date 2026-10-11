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
import { useSubscription } from '@/lib/subscription/session';
import { store as attemptStore } from '@/routes/learning/attempts';
import { complete as lessonComplete } from '@/routes/learning/lessons';
import { show as progressShow } from '@/routes/progress';
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
    rejectionNotice: string | null;
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
    const owner = useRef(userId);
    owner.current = userId;
    return (
        <AccountProgressSession
            key={userId ?? 'guest'}
            userId={userId}
            owner={owner}
            pollMs={page.props.progressPollMs ?? DEFAULT_POLL_MS}
            initialProgress={initialProgress}
        >
            {children}
        </AccountProgressSession>
    );
}

function AccountProgressSession({
    children,
    userId,
    owner,
    pollMs,
    initialProgress,
}: {
    children: ReactNode;
    userId: number | null;
    owner: { current: number | null };
    pollMs: number;
    initialProgress: ProgressSnapshot | null;
}) {
    const { refresh: refreshSubscription } = useSubscription();
    const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);
    const generation = useRef(0);
    const isCurrent = useCallback(
        (expected: number) =>
            owner.current === userId && generation.current === expected,
        [owner, userId],
    );
    useEffect(
        () => () => {
            generation.current++;
        },
        [],
    );
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
        const expected = generation.current;

        try {
            const snapshot = await api.current.get<ProgressSnapshot>(
                progressShow.url(),
            );
            if (isCurrent(expected)) applySnapshot(snapshot);
        } catch {
            // Snapshot terakhir tetap dipakai; polling berikutnya mencoba lagi.
        } finally {
            inFlight.current = false;
        }
    }, [applySnapshot, isCurrent]);

    const flush = useCallback(async () => {
        if (!outbox) {
            return;
        }

        const expected = generation.current;
        if (!isCurrent(expected)) return;
        setPendingCount(outbox.size());

        await outbox.flush(
            async (job: OutboxJob): Promise<SendResult> => {
                try {
                    await api.current.post(job.url, job.body);

                    return 'ok';
                } catch (error) {
                    if (error instanceof ApiError) {
                        if (error.code === 'plus_required') {
                            if (isCurrent(expected)) {
                                setRejectionNotice(
                                    'Jawaban offline belum diterima karena pelajaran memerlukan Plus aktif. Periksa status Plus, lalu kirim ulang jawaban.',
                                );
                                void refreshSubscription();
                            }
                            return 'drop';
                        }
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
            },
            () => isCurrent(expected),
        );

        if (isCurrent(expected)) setPendingCount(outbox.size());
    }, [outbox, isCurrent, refreshSubscription]);

    const submit = useCallback(
        async (input: StepAttemptInput): Promise<AttemptResult> => {
            const expected = generation.current;
            if (!isCurrent(expected)) throw new Error('Account changed');
            try {
                const result = await api.current.post<AttemptResult>(
                    attemptStore.url(),
                    input,
                );
                if (!isCurrent(expected)) throw new Error('Account changed');
                applySnapshot(result.progress);
                setRejectionNotice(null);
                notifyProgress(channel.current, result.progress.updatedAt ?? 0);

                return result;
            } catch (error) {
                if (
                    isCurrent(expected) &&
                    outbox &&
                    !(
                        error instanceof ApiError &&
                        error.code === 'plus_required'
                    ) &&
                    (!(error instanceof ApiError) ||
                        error.status === 419 ||
                        error.status === 429 ||
                        error.status >= 500)
                ) {
                    outbox.enqueue({
                        id: input.attempt_id,
                        url: attemptStore.url(),
                        body: input,
                    });
                    setPendingCount(outbox.size());
                }

                throw error;
            }
        },
        [outbox, applySnapshot, isCurrent],
    );

    const completeLesson = useCallback(
        async (lessonId: string, contentRevision: number) => {
            const expected = generation.current;
            if (!isCurrent(expected)) throw new Error('Account changed');
            const result = await api.current.post<{
                progress: ProgressSnapshot;
            }>(lessonComplete.url(lessonId), {
                content_revision: contentRevision,
            });
            if (!isCurrent(expected)) throw new Error('Account changed');
            applySnapshot(result.progress);
            notifyProgress(channel.current, result.progress.updatedAt ?? 0);
        },
        [applySnapshot, isCurrent],
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
            rejectionNotice,
        }),
        [
            progress,
            refresh,
            submit,
            completeLesson,
            flush,
            pendingCount,
            rejectionNotice,
        ],
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
