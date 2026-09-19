import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    createLessonStore,
    stepProgress,
    type StepOutcome,
} from './lesson-store';

const outcome = (xpAwarded: number): StepOutcome => ({
    correct: true,
    feedback: 'ok',
    consumeHeart: false,
    xpAwarded,
});

void test('starts at the first step', () => {
    const store = createLessonStore();

    assert.equal(store.getState().stepIndex, 0);
    assert.equal(store.getState().xpEarned, 0);
});

void test('records outcomes and accumulates earned xp', () => {
    const store = createLessonStore();

    store.getState().recordOutcome('step-1', outcome(5));
    store.getState().recordOutcome('step-2', outcome(7));

    assert.equal(store.getState().outcomes['step-1'].xpAwarded, 5);
    assert.equal(store.getState().xpEarned, 12);
});

void test('next and previous stay inside bounds', () => {
    const store = createLessonStore();

    store.getState().next(3);
    assert.equal(store.getState().stepIndex, 1);
    store.getState().next(3);
    store.getState().next(3);
    assert.equal(store.getState().stepIndex, 2);

    store.getState().previous();
    store.getState().previous();
    store.getState().previous();
    assert.equal(store.getState().stepIndex, 0);
});

void test('reset clears progress', () => {
    const store = createLessonStore();

    store.getState().recordOutcome('step-1', outcome(5));
    store.getState().next(3);
    store.getState().setCompleted(true);
    store.getState().reset();

    assert.equal(store.getState().stepIndex, 0);
    assert.equal(store.getState().xpEarned, 0);
    assert.equal(store.getState().completed, false);
    assert.deepEqual(store.getState().outcomes, {});
});

void test('step progress is a safe percentage', () => {
    assert.equal(stepProgress(0, 0), 0);
    assert.equal(stepProgress(0, 1), 100);
    assert.equal(stepProgress(1, 4), 50);
    assert.equal(stepProgress(9, 4), 100);
});
