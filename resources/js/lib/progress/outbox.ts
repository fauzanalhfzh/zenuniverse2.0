export interface OutboxJob {
    id: string;
    url: string;
    body: unknown;
    createdAt: number;
    attempts: number;
    notBefore?: number;
}

export interface OutboxStorage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
}

export type SendResult = 'ok' | 'retry' | 'drop';
export type SendFunction = (job: OutboxJob) => Promise<SendResult>;

export const MAX_JOBS = 100;
export const STORAGE_PREFIX = 'zenuniverse.outbox.v1';

export function memoryStorage(): OutboxStorage {
    const store = new Map<string, string>();

    return {
        get: (key) => store.get(key) ?? null,
        set: (key, value) => {
            store.set(key, value);
        },
        remove: (key) => {
            store.delete(key);
        },
    };
}

export function localStorageAdapter(): OutboxStorage {
    if (typeof localStorage === 'undefined') {
        return memoryStorage();
    }

    return {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => {
            localStorage.setItem(key, value);
        },
        remove: (key) => {
            localStorage.removeItem(key);
        },
    };
}

export function backoffMs(attempts: number): number {
    return Math.min(60_000, 1000 * 2 ** Math.min(Math.max(attempts, 1), 6));
}

/**
 * Per-user persistent queue of unacknowledged submissions. The attempt id is the
 * idempotency key, so replays never double-award and a flush cannot cross users.
 */
export class ProgressOutbox {
    private readonly userId: string | number;

    private readonly storage: OutboxStorage;

    private readonly now: () => number;

    constructor(
        userId: string | number,
        storage: OutboxStorage = localStorageAdapter(),
        now: () => number = () => Date.now(),
    ) {
        this.userId = userId;
        this.storage = storage;
        this.now = now;
    }

    key(): string {
        return `${STORAGE_PREFIX}.${this.userId}`;
    }

    all(): OutboxJob[] {
        const raw = this.storage.get(this.key());

        if (!raw) {
            return [];
        }

        try {
            const parsed: unknown = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.filter(
                (job): job is OutboxJob =>
                    typeof job === 'object' &&
                    job !== null &&
                    typeof (job as OutboxJob).id === 'string',
            );
        } catch {
            return [];
        }
    }

    size(): number {
        return this.all().length;
    }

    enqueue(job: { id: string; url: string; body: unknown }): void {
        const jobs = this.all();

        if (jobs.some((existing) => existing.id === job.id)) {
            return;
        }

        while (jobs.length >= MAX_JOBS) {
            jobs.shift();
        }

        jobs.push({ ...job, createdAt: this.now(), attempts: 0 });
        this.save(jobs);
    }

    async flush(
        send: SendFunction,
    ): Promise<{ sent: number; retried: number; dropped: number }> {
        const jobs = this.all();
        const remaining: OutboxJob[] = [];
        let sent = 0;
        let retried = 0;
        let dropped = 0;

        for (const job of jobs) {
            if (job.notBefore !== undefined && job.notBefore > this.now()) {
                remaining.push(job);
                continue;
            }

            const result = await send(job);

            if (result === 'ok') {
                sent += 1;
            } else if (result === 'drop') {
                dropped += 1;
            } else {
                const attempts = job.attempts + 1;
                remaining.push({
                    ...job,
                    attempts,
                    notBefore: this.now() + backoffMs(attempts),
                });
                retried += 1;
            }
        }

        this.save(remaining);

        return { sent, retried, dropped };
    }

    clear(): void {
        this.storage.remove(this.key());
    }

    private save(jobs: OutboxJob[]): void {
        this.storage.set(this.key(), JSON.stringify(jobs));
    }
}
