import * as Blockly from 'blockly';
import { useEffect, useRef } from 'react';
import { ChallengeBoard } from '@/components/lesson/challenge-board';
import { Button } from '@/components/ui/button';
import {
    commandsToWorkspaceState,
    workspaceToCommands,
} from '@/lib/content/blockly-adapter';
import type { BlocklyCommand, BlocklyStep } from '@/types/lesson';

const blockDefinitions = [
    {
        type: 'zen_move_forward',
        message0: 'MOVE FORWARD',
        previousStatement: null,
        nextStatement: null,
        colour: 210,
    },
    {
        type: 'zen_turn_right',
        message0: 'TURN RIGHT',
        previousStatement: null,
        nextStatement: null,
        colour: 210,
    },
    {
        type: 'zen_repeat',
        message0: 'REPEAT %1 TIMES %2',
        args0: [
            { type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 5 },
            { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 55,
    },
];

const blockTypeByCommand = {
    move_forward: 'zen_move_forward',
    turn_right: 'zen_turn_right',
    repeat: 'zen_repeat',
} as const;

let blocksDefined = false;

function ensureBlocks(): void {
    if (blocksDefined) {
        return;
    }

    Blockly.common.defineBlocksWithJsonArray(blockDefinitions);
    blocksDefined = true;
}

export function BlocklyStepView({
    step,
    pending,
    onSubmit,
}: {
    step: BlocklyStep;
    pending: boolean;
    onSubmit: (commands: BlocklyCommand[]) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const challenge = step.challenge;

    useEffect(() => {
        if (!containerRef.current || !challenge) {
            return;
        }

        ensureBlocks();

        const workspace = Blockly.inject(containerRef.current, {
            toolbox: {
                kind: 'flyoutToolbox',
                contents: (
                    step.content.availableBlocks ?? [
                        'move_forward',
                        'turn_right',
                        'repeat',
                    ]
                ).map((command) => ({
                    kind: 'block',
                    type: blockTypeByCommand[command],
                })),
            },
            renderer: 'zelos',
            trashcan: true,
            scrollbars: true,
            zoom: { controls: true, wheel: true, startScale: 0.9 },
        });

        workspaceRef.current = workspace;

        if (challenge.starterProgram?.length) {
            Blockly.serialization.workspaces.load(
                commandsToWorkspaceState(challenge.starterProgram),
                workspace,
            );
        }

        return () => {
            workspace.dispose();
            workspaceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step.id]);

    function reset(): void {
        const workspace = workspaceRef.current;

        if (!workspace || !challenge) {
            return;
        }

        workspace.clear();

        if (challenge.starterProgram?.length) {
            Blockly.serialization.workspaces.load(
                commandsToWorkspaceState(challenge.starterProgram),
                workspace,
            );
        }
    }

    function run(): void {
        const workspace = workspaceRef.current;

        if (!workspace) {
            return;
        }

        onSubmit(workspaceToCommands(workspace));
    }

    return (
        <div className="flex flex-col gap-5">
            {step.content.title ? (
                <h2 className="font-display text-2xl font-bold text-slate-900">
                    {step.content.title}
                </h2>
            ) : null}
            {step.content.objective ? (
                <p className="leading-relaxed text-slate-600">
                    {step.content.objective}
                </p>
            ) : null}

            {challenge ? <ChallengeBoard challenge={challenge} /> : null}

            <div
                ref={containerRef}
                className="border-border h-80 w-full overflow-hidden rounded-2xl border-2"
            />

            <div className="flex flex-wrap gap-3">
                <Button onClick={run} disabled={pending}>
                    {pending ? 'Menjalankan...' : 'Jalankan program'}
                </Button>
                <Button variant="outline" onClick={reset} disabled={pending}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
