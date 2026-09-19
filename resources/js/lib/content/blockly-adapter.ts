import type * as Blockly from 'blockly';
import type { BlocklyCommand } from '@/types/lesson';

const blockTypeByCommand: Record<BlocklyCommand['type'], string> = {
    move_forward: 'zen_move_forward',
    turn_right: 'zen_turn_right',
    repeat: 'zen_repeat',
};

function readChain(firstBlock: Blockly.Block | null): BlocklyCommand[] {
    const commands: BlocklyCommand[] = [];
    let currentBlock = firstBlock;

    while (currentBlock) {
        const command = readCommand(currentBlock);

        if (command) {
            commands.push(command);
        }

        currentBlock = currentBlock.getNextBlock();
    }

    return commands;
}

function readCommand(block: Blockly.Block): BlocklyCommand | null {
    switch (block.type) {
        case 'zen_move_forward':
            return { type: 'move_forward' };
        case 'zen_turn_right':
            return { type: 'turn_right' };
        case 'zen_repeat': {
            const rawCount = Number(block.getFieldValue('TIMES'));
            const count = Number.isFinite(rawCount)
                ? Math.max(0, Math.floor(rawCount))
                : 0;

            return {
                type: 'repeat',
                count,
                children: readChain(block.getInputTargetBlock('DO')),
            };
        }
        default:
            return null;
    }
}

/** Reads the submitted command chain from a live Blockly workspace. */
export function workspaceToCommands(
    workspace: Blockly.WorkspaceSvg,
): BlocklyCommand[] {
    const topBlocks = workspace
        .getTopBlocks(true)
        .sort(
            (first, second) =>
                first.getRelativeToSurfaceXY().y -
                second.getRelativeToSurfaceXY().y,
        );

    return readChain(topBlocks[0] ?? null);
}

function commandChainToState(
    commands: BlocklyCommand[],
): Record<string, unknown> | undefined {
    const [command, ...remainingCommands] = commands;

    if (!command) {
        return undefined;
    }

    const state: Record<string, unknown> = {
        type: blockTypeByCommand[command.type],
    };

    if (command.type === 'repeat') {
        state.fields = { TIMES: command.count };
        const child = commandChainToState(command.children);

        if (child) {
            state.inputs = { DO: { block: child } };
        }
    }

    const next = commandChainToState(remainingCommands);

    if (next) {
        state.next = { block: next };
    }

    return state;
}

export function commandsToWorkspaceState(commands: BlocklyCommand[]) {
    const firstBlock = commandChainToState(commands);

    return {
        blocks: {
            languageVersion: 0,
            blocks: firstBlock ? [{ ...firstBlock, x: 24, y: 24 }] : [],
        },
    };
}

function stateToCommandChain(
    state: Record<string, unknown> | undefined,
): BlocklyCommand[] {
    if (!state || typeof state.type !== 'string') {
        return [];
    }

    let command: BlocklyCommand | null = null;

    if (state.type === 'zen_move_forward') {
        command = { type: 'move_forward' };
    } else if (state.type === 'zen_turn_right') {
        command = { type: 'turn_right' };
    } else if (state.type === 'zen_repeat') {
        const fields = state.fields as Record<string, unknown> | undefined;
        const rawCount = Number(fields?.TIMES);
        const inputs = state.inputs as
            | Record<string, { block?: Record<string, unknown> }>
            | undefined;

        command = {
            type: 'repeat',
            count: Number.isFinite(rawCount)
                ? Math.max(0, Math.floor(rawCount))
                : 0,
            children: stateToCommandChain(inputs?.DO?.block),
        };
    }

    const next = state.next as { block?: Record<string, unknown> } | undefined;

    return command ? [command, ...stateToCommandChain(next?.block)] : [];
}

/** Inverse of {@link commandsToWorkspaceState}, kept pure so it is unit-testable. */
export function workspaceStateToCommands(
    state: Record<string, unknown>,
): BlocklyCommand[] {
    const blocks = (state as { blocks?: { blocks?: unknown } }).blocks;
    const list = Array.isArray(blocks?.blocks)
        ? (blocks?.blocks as unknown[])
        : [];
    const first = list[0] as Record<string, unknown> | undefined;

    return stateToCommandChain(first);
}
