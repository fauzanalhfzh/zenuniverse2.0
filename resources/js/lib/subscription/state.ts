export interface SubscriptionSnapshot {
    plusActive: boolean;
    accessUntil: string | null;
    revision: number;
    evaluatedAt: string;
    checkoutAvailable: boolean;
}

export interface SubscriptionState {
    status: 'loading' | 'ready' | 'error';
    plusActive: boolean;
    expiresAt: number | null;
}

const loading: SubscriptionState = {
    status: 'loading',
    plusActive: false,
    expiresAt: null,
};

export class SubscriptionSession {
    state = loading;
    private sequence = 0;
    private revision = -1;
    private evaluatedAt = -Infinity;
    private listeners = new Set<() => void>();

    private readonly request: () => Promise<SubscriptionSnapshot>;
    private readonly now: () => number;

    constructor(
        request: () => Promise<SubscriptionSnapshot>,
        now: () => number = () => performance.now(),
    ) {
        this.request = request;
        this.now = now;
    }

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = () => this.state;

    private update(state: SubscriptionState) {
        this.state = state;
        this.listeners.forEach((listener) => listener());
    }

    invalidate = () => {
        this.sequence++;
        this.update({ status: 'error', plusActive: false, expiresAt: null });
    };

    expire = () => {
        if (
            this.state.expiresAt !== null &&
            this.now() >= this.state.expiresAt
        ) {
            this.update({
                status: 'ready',
                plusActive: false,
                expiresAt: null,
            });
        }
    };

    refresh = async () => {
        const sequence = ++this.sequence;
        const startedAt = this.now();
        this.update(loading);
        try {
            const snapshot = await this.request();
            if (sequence !== this.sequence) return;
            const evaluatedAt = Date.parse(snapshot.evaluatedAt);
            const accessUntil =
                snapshot.accessUntil === null
                    ? null
                    : Date.parse(snapshot.accessUntil);
            if (
                typeof snapshot.plusActive !== 'boolean' ||
                !Number.isSafeInteger(snapshot.revision) ||
                snapshot.revision < this.revision ||
                !Number.isFinite(evaluatedAt) ||
                evaluatedAt < this.evaluatedAt ||
                (accessUntil !== null && !Number.isFinite(accessUntil)) ||
                (snapshot.plusActive && accessUntil === null)
            )
                throw new Error('Invalid subscription snapshot');
            this.revision = snapshot.revision;
            this.evaluatedAt = evaluatedAt;
            // Subtract full round-trip time: late responses never extend access.
            const expiresAt =
                accessUntil === null
                    ? null
                    : startedAt + accessUntil - evaluatedAt;
            const plusActive =
                snapshot.plusActive &&
                expiresAt !== null &&
                expiresAt > this.now();
            this.update({
                status: 'ready',
                plusActive,
                expiresAt: plusActive ? expiresAt : null,
            });
        } catch {
            if (sequence === this.sequence) this.invalidate();
        }
    };
}
