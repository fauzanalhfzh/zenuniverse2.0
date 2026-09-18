import assert from 'node:assert/strict';
import { test } from 'node:test';
import { backoffMs, MAX_JOBS, memoryStorage, ProgressOutbox } from './outbox';

function job(id: string) {
    return { id, url: '/learning/attempts', body: { attempt_id: id } };
}

void test('enqueue deduplicates by id', () => {
    const outbox = new ProgressOutbox('user-1', memoryStorage());

    outbox.enqueue(job('a'));
    outbox.enqueue(job('a'));

    assert.equal(outbox.size(), 1);
});

void test('enqueue caps queue and drops oldest', () => {
    const outbox = new ProgressOutbox('user-1', memoryStorage());

    for (let index = 0; index < MAX_JOBS + 5; index++) {
        outbox.enqueue(job(`job-${index}`));
    }

    assert.equal(outbox.size(), MAX_JOBS);
    assert.equal(
        outbox.all().some((entry) => entry.id === 'job-0'),
        false,
    );
    assert.equal(
        outbox.all().some((entry) => entry.id === `job-${MAX_JOBS + 4}`),
        true,
    );
});

void test('flush sends and clears confirmed jobs', async () => {
    const outbox = new ProgressOutbox('user-1', memoryStorage());
    outbox.enqueue(job('a'));
    outbox.enqueue(job('b'));

    const result = await outbox.flush(async () => 'ok');

    assert.deepEqual(result, { sent: 2, retried: 0, dropped: 0 });
    assert.equal(outbox.size(), 0);
});

void test('retry schedules backoff and skips until due', async () => {
    let now = 1_000;
    const outbox = new ProgressOutbox('user-1', memoryStorage(), () => now);
    outbox.enqueue(job('a'));

    const retried = await outbox.flush(async () => 'retry');

    assert.deepEqual(retried, { sent: 0, retried: 1, dropped: 0 });
    assert.equal(outbox.size(), 1);
    assert.equal(outbox.all()[0].attempts, 1);
    assert.equal(outbox.all()[0].notBefore, 1_000 + backoffMs(1));

    const early = await outbox.flush(async () => 'ok');
    assert.equal(early.sent, 0);

    now += backoffMs(1) + 1;
    const late = await outbox.flush(async () => 'ok');
    assert.equal(late.sent, 1);
    assert.equal(outbox.size(), 0);
});

void test('drop removes job without sending', async () => {
    const outbox = new ProgressOutbox('user-1', memoryStorage());
    outbox.enqueue(job('a'));

    const result = await outbox.flush(async () => 'drop');

    assert.deepEqual(result, { sent: 0, retried: 0, dropped: 1 });
    assert.equal(outbox.size(), 0);
});

void test('queues are isolated per user', () => {
    const storage = memoryStorage();
    const first = new ProgressOutbox('user-1', storage);
    const second = new ProgressOutbox('user-2', storage);

    first.enqueue(job('a'));

    assert.equal(first.size(), 1);
    assert.equal(second.size(), 0);

    second.enqueue(job('b'));
    first.clear();

    assert.equal(first.size(), 0);
    assert.equal(second.size(), 1);
});

void test('pending jobs persist across instances', () => {
    const storage = memoryStorage();
    new ProgressOutbox('user-1', storage).enqueue(job('a'));

    const reopened = new ProgressOutbox('user-1', storage);

    assert.equal(reopened.size(), 1);
    assert.equal(reopened.all()[0].id, 'a');
});
