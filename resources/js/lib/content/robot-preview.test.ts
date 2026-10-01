import assert from 'node:assert/strict';
import { test } from 'node:test';
import { previewRobot } from './robot-preview';
import type { BlocklyChallengeConfig } from '@/types/lesson';

const challenge: BlocklyChallengeConfig = {
    board: { width: 3, height: 3 },
    start: { x: 0, y: 0, direction: 'east' },
    goal: { x: 2, y: 1 },
    obstacles: [{ x: 1, y: 1 }],
    maxExecutionSteps: 20,
    hint: '',
};

test('preview follows nested blocks and stops at goal', () => {
    assert.deepEqual(
        previewRobot(
            [
                {
                    type: 'repeat',
                    count: 2,
                    children: [{ type: 'move_forward' }],
                },
                { type: 'turn_right' },
                { type: 'move_forward' },
                { type: 'move_forward' },
            ],
            challenge,
        ),
        [
            { x: 0, y: 0, direction: 'east' },
            { x: 1, y: 0, direction: 'east' },
            { x: 2, y: 0, direction: 'east' },
            { x: 2, y: 0, direction: 'south' },
            { x: 2, y: 1, direction: 'south' },
        ],
    );
});

test('preview stops before obstacle', () => {
    assert.deepEqual(
        previewRobot(
            [
                { type: 'move_forward' },
                { type: 'turn_right' },
                { type: 'move_forward' },
            ],
            challenge,
        ).at(-1),
        { x: 1, y: 0, direction: 'south' },
    );
});
