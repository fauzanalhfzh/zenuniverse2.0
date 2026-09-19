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
import type {
    AttemptResult,
    ProgressSnapshot,
    StepAttemptInput,
} from '@/types/lesson';

interface AuthPageProps {
    auth?: { user?: { id: number } | null };
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

export function ProgressSessionProvider({
    children,
    initialProgress = null,
}: {
    children: ReactNode;
    initialProgress?: ProgressSnapshot | null;
}) {
    const page = usePage<AuthPageProps>();
    const userId = page.props.auth?.user?.id ?? null;
    const api = useRef(new ApiClient());
    const [progress, setProgress] = useState<ProgressSnapshot | null>(
        initialProgress,
    );
    const [pendingCount, setPendingCount] = useState(0);

    const outbox = useMemo(
        () => (userId === null ? null : new ProgressOutbox(userId)),
        [userId],
    );

    const refresh = useCallback(async () => {
        try {
            const snapshot =
                await api.current.get<ProgressSnapshot>('/me/progress');
            setProgress(snapshot);
        } catch {
            // Keep the last known snapshot; the outbox will retry on the next flush.
        }
    }, []);

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
                setProgress(result.progress);

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
        [outbox],
    );

    const completeLesson = useCallback(
        async (lessonId: string, contentRevision: number) => {
            const result = await api.current.post<{
                progress: ProgressSnapshot;
            }>(`/learning/lessons/${lessonId}/complete`, {
                content_revision: contentRevision,
            });
            setProgress(result.progress);
        },
        [],
    );

    useEffect(() => {
        if (userId === null) {
            return;
        }

        void refresh();
        void flush();
    }, [userId, refresh, flush]);

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
