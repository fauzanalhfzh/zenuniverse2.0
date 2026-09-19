import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    commandsToWorkspaceState,
    workspaceStateToCommands,
} from './blockly-adapter';
import type { BlocklyCommand } from '@/types/lesson';

const program: BlocklyCommand[] = [
    { type: 'move_forward' },
    { type: 'turn_right' },
    {
        type: 'repeat',
        count: 3,
        children: [{ type: 'move_forward' }, { type: 'turn_right' }],
    },
    { type: 'move_forward' },
];

void test('workspace state round-trips a command chain', () => {
    const state = commandsToWorkspaceState(program);

    assert.deepEqual(
        workspaceStateToCommands(state as Record<string, unknown>),
        program,
    );
});

void test('empty program produces empty state', () => {
    const state = commandsToWorkspaceState([]);

    assert.deepEqual(state.blocks.blocks, []);
    assert.deepEqual(
        workspaceStateToCommands(state as Record<string, unknown>),
        [],
    );
});

void test('nested repeat children survive the round trip', () => {
    const nested: BlocklyCommand[] = [
        {
            type: 'repeat',
            count: 2,
            children: [
                {
                    type: 'repeat',
                    count: 4,
                    children: [{ type: 'turn_right' }],
                },
            ],
        },
    ];

    const state = commandsToWorkspaceState(nested);

    assert.deepEqual(
        workspaceStateToCommands(state as Record<string, unknown>),
        nested,
    );
});
