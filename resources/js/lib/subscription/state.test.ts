import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SubscriptionSession, type SubscriptionSnapshot } from './state';

const snapshot = (revision = 1, seconds = 60): SubscriptionSnapshot => ({
    plusActive: true,
    accessUntil: new Date(Date.UTC(2026, 0, 1) + seconds * 1000).toISOString(),
    evaluatedAt: new Date(Date.UTC(2026, 0, 1)).toISOString(),
    revision,
    checkoutAvailable: false,
});

function deferred() {
    let resolve!: (value: SubscriptionSnapshot) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<SubscriptionSnapshot>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

test('latest request wins even when old response arrives last', async () => {
    const old = deferred();
    const fresh = deferred();
    let requests = 0;
    const session = new SubscriptionSession(
        () => (requests++ === 0 ? old.promise : fresh.promise),
        () => 0,
    );
    const first = session.refresh();
    const second = session.refresh();
    fresh.resolve({ ...snapshot(2), plusActive: false });
    await second;
    old.resolve(snapshot(1));
    await first;
    assert.equal(session.state.plusActive, false);
});

test('expiry uses server delta and monotonic elapsed time, not progress revision or client date', async () => {
    let now = 500;
    const session = new SubscriptionSession(
        async () => snapshot(),
        () => now,
    );
    await session.refresh();
    assert.equal(session.state.plusActive, true);
    now += 60_000;
    session.expire();
    assert.equal(session.state.plusActive, false);
    await session.refresh();
    assert.equal(session.state.plusActive, true);
});

test('round-trip time reduces remaining grant', async () => {
    let now = 0;
    const session = new SubscriptionSession(
        async () => {
            now = 61_000;
            return snapshot();
        },
        () => now,
    );
    await session.refresh();
    assert.equal(session.state.plusActive, false);
});

test('offline invalidation rejects pending grant and failed refresh fails closed', async () => {
    const pending = deferred();
    let fail = false;
    const session = new SubscriptionSession(
        () => (fail ? Promise.reject(new Error('Offline')) : pending.promise),
        () => 0,
    );
    const request = session.refresh();
    session.invalidate();
    pending.resolve(snapshot());
    await request;
    assert.equal(session.state.plusActive, false);
    fail = true;
    await session.refresh();
    assert.equal(session.state.status, 'error');
    assert.equal(session.state.plusActive, false);
});

test('account sessions never share grant or revision', async () => {
    const old = new SubscriptionSession(
        async () => snapshot(99),
        () => 0,
    );
    await old.refresh();
    const next = new SubscriptionSession(
        async () => ({ ...snapshot(), plusActive: false }),
        () => 0,
    );
    assert.equal(next.state.plusActive, false);
    old.invalidate();
    await next.refresh();
    assert.equal(next.state.status, 'ready');
    assert.equal(next.state.plusActive, false);
});

test('lower server revision and evaluation time cannot restore grant', async () => {
    let value = snapshot(2);
    const session = new SubscriptionSession(
        async () => value,
        () => 0,
    );
    await session.refresh();
    value = snapshot(1);
    await session.refresh();
    assert.equal(session.state.status, 'error');
    value = { ...snapshot(2), evaluatedAt: '2025-12-31T23:59:59Z' };
    await session.refresh();
    assert.equal(session.state.plusActive, false);
});
