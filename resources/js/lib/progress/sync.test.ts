import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isFreshSnapshot, shouldPoll, withJitter } from './sync';

void test('polls only when visible, online, and focused', () => {
    assert.equal(
        shouldPoll({ visible: true, online: true, focused: true }),
        true,
    );
    assert.equal(
        shouldPoll({ visible: false, online: true, focused: true }),
        false,
    );
    assert.equal(
        shouldPoll({ visible: true, online: false, focused: true }),
        false,
    );
    assert.equal(
        shouldPoll({ visible: true, online: true, focused: false }),
        false,
    );
});

void test('jitter stays within plus or minus 25 percent', () => {
    assert.equal(
        withJitter(1000, () => 0),
        750,
    );
    assert.equal(
        withJitter(1000, () => 0.5),
        1000,
    );
    assert.equal(
        withJitter(1000, () => 1),
        1250,
    );
});

void test('rejects stale snapshots', () => {
    assert.equal(isFreshSnapshot({ updatedAt: 10 }, null), true);
    assert.equal(isFreshSnapshot({ updatedAt: 20 }, { updatedAt: 10 }), true);
    assert.equal(isFreshSnapshot({ updatedAt: 10 }, { updatedAt: 20 }), false);
    assert.equal(isFreshSnapshot({ updatedAt: 20 }, { updatedAt: 20 }), true);
});

void test('missing timestamps are treated as zero', () => {
    assert.equal(isFreshSnapshot({}, { updatedAt: 5 }), false);
    assert.equal(isFreshSnapshot({ updatedAt: 5 }, {}), true);
});
