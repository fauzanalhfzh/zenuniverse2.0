export const PROGRESS_CHANNEL = 'zenuniverse.progress';

export interface SyncVisibility {
    visible: boolean;
    online: boolean;
    focused: boolean;
}

export interface SnapshotStamp {
    updatedAt?: number;
}

/** Hanya polling saat tab terlihat, online, dan jendela aktif. */
export function shouldPoll(state: SyncVisibility): boolean {
    return state.visible && state.online && state.focused;
}

/** Jitter ±25% supaya banyak tab tidak menembak bersamaan. */
export function withJitter(
    ms: number,
    random: () => number = Math.random,
): number {
    return Math.round(ms * (0.75 + random() * 0.5));
}

/**
 * Tolak snapshot lama agar response yang datang terlambat tidak menimpa state
 * yang lebih baru (mis. hasil submit sesudahnya).
 */
export function isFreshSnapshot(
    next: SnapshotStamp,
    current: SnapshotStamp | null,
): boolean {
    if (current === null) {
        return true;
    }

    return (next.updatedAt ?? 0) >= (current.updatedAt ?? 0);
}

export interface ProgressMessage {
    type: 'progress.updated';
    updatedAt: number;
}

export function notifyProgress(
    channel: BroadcastChannel | null,
    updatedAt: number,
): void {
    channel?.postMessage({
        type: 'progress.updated',
        updatedAt,
    } satisfies ProgressMessage);
}
