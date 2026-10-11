import { usePage } from '@inertiajs/react';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useSyncExternalStore,
    type ReactNode,
} from 'react';
import { api } from '@/lib/progress/client';
import { SubscriptionSession, type SubscriptionSnapshot } from './state';
import { show } from '@/routes/subscription';

const SubscriptionContext = createContext<SubscriptionSession | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth?: { user?: { id: number } | null } }>()
        .props;
    const userId = auth?.user?.id ?? null;
    const session = useMemo(
        () =>
            new SubscriptionSession(async () => {
                if (userId === null || !navigator.onLine)
                    throw new Error('Offline');
                return api.get<SubscriptionSnapshot>(show.url());
            }),
        [userId],
    );
    const state = useSyncExternalStore(
        session.subscribe,
        session.getSnapshot,
        session.getSnapshot,
    );

    useEffect(() => {
        if (userId === null) return;
        const refresh = () => {
            void session.refresh();
        };
        const visible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        window.addEventListener('offline', session.invalidate);
        document.addEventListener('visibilitychange', visible);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            window.removeEventListener('offline', session.invalidate);
            document.removeEventListener('visibilitychange', visible);
            session.invalidate();
        };
    }, [session, userId]);

    useEffect(() => {
        if (state.expiresAt === null) return;
        const timer = window.setTimeout(
            () => {
                session.expire();
                void session.refresh();
            },
            Math.min(
                Math.max(0, state.expiresAt - performance.now()),
                2_147_483_647,
            ),
        );
        return () => window.clearTimeout(timer);
    }, [session, state]);

    return (
        <SubscriptionContext.Provider value={session}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const session = useContext(SubscriptionContext);
    if (!session)
        throw new Error('useSubscription requires SubscriptionProvider');
    const state = useSyncExternalStore(
        session.subscribe,
        session.getSnapshot,
        session.getSnapshot,
    );
    return { ...state, refresh: session.refresh };
}
