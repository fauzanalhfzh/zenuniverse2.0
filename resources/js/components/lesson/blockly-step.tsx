import * as Blockly from 'blockly';
import { Blocks, Flag, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChallengeBoard } from '@/components/lesson/challenge-board';
import { previewRobot } from '@/lib/content/robot-preview';
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
    const [blockCount, setBlockCount] = useState(0);
    const [robot, setRobot] = useState(step.challenge?.start);
    const [running, setRunning] = useState(false);
    const runRef = useRef<AbortController | null>(null);
    const challenge = step.challenge;

    useEffect(() => () => runRef.current?.abort(), []);

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
            maxBlocks: challenge.maxBlocks,
            grid: {
                spacing: 24,
                length: 2,
                colour: '#d5deeb',
                snap: true,
            },
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

        const updateBlockCount = () => {
            setBlockCount(workspace.getAllBlocks(false).length);
        };
        const resizeObserver = new ResizeObserver(() =>
            Blockly.svgResize(workspace),
        );

        workspace.addChangeListener(updateBlockCount);
        resizeObserver.observe(containerRef.current);
        updateBlockCount();

        return () => {
            resizeObserver.disconnect();
            workspace.removeChangeListener(updateBlockCount);
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

        runRef.current?.abort();
        setRunning(false);
        setRobot(challenge.start);
        workspace.clear();

        if (challenge.starterProgram?.length) {
            Blockly.serialization.workspaces.load(
                commandsToWorkspaceState(challenge.starterProgram),
                workspace,
            );
        }
    }

    async function run(): Promise<void> {
        const workspace = workspaceRef.current;
        if (!workspace || !challenge || running || pending) return;

        const commands = workspaceToCommands(workspace);
        const frames = previewRobot(commands, challenge);
        const controller = new AbortController();
        runRef.current?.abort();
        runRef.current = controller;
        setRobot(challenge.start);
        setRunning(true);

        try {
            if (
                !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                for (const frame of frames.slice(1)) {
                    setRobot(frame);
                    await new Promise<void>((resolve) => {
                        const timer = window.setTimeout(resolve, 550);
                        controller.signal.addEventListener(
                            'abort',
                            () => {
                                clearTimeout(timer);
                                resolve();
                            },
                            { once: true },
                        );
                    });
                    if (controller.signal.aborted) return;
                }
            } else {
                setRobot(frames.at(-1) ?? challenge.start);
            }
            if (!controller.signal.aborted) onSubmit(commands);
        } finally {
            if (!controller.signal.aborted) setRunning(false);
        }
    }

    const maxBlocks = challenge?.maxBlocks;

    return (
        <div className="blockly-lesson">
            <div className="blockly-lesson__toolbar">
                <div className="blockly-lesson__tab">
                    <Blocks size={18} aria-hidden="true" />
                    Kode block
                </div>
                <div className="blockly-lesson__toolbar-actions">
                    <button
                        type="button"
                        className="blockly-lesson__reset"
                        onClick={reset}
                        disabled={pending || running}
                    >
                        <RotateCcw size={17} aria-hidden="true" />
                        Atur ulang
                    </button>
                    <button
                        type="button"
                        className="blockly-lesson__run"
                        onClick={() => void run()}
                        disabled={pending || running}
                    >
                        <Play
                            size={17}
                            aria-hidden="true"
                            fill="currentColor"
                        />
                        {pending || running
                            ? 'Menjalankan...'
                            : 'Jalankan program'}
                    </button>
                </div>
            </div>

            <div className="blockly-lesson__workspace">
                <section
                    className="blockly-lesson__editor"
                    aria-labelledby={`blockly-editor-${step.id}`}
                >
                    <div className="blockly-lesson__panel-heading">
                        <span id={`blockly-editor-${step.id}`}>
                            Area program
                        </span>
                        {maxBlocks ? (
                            <span className="blockly-lesson__block-count">
                                {blockCount} / {maxBlocks} blok
                            </span>
                        ) : null}
                    </div>
                    <div
                        ref={containerRef}
                        className="blockly-lesson__canvas"
                    />
                </section>

                <aside className="blockly-lesson__side" aria-label="Tantangan">
                    <section className="blockly-lesson__stage">
                        <div className="blockly-lesson__panel-heading">
                            <span>
                                <Flag size={17} aria-hidden="true" />
                                Panggung
                            </span>
                            <span
                                className="blockly-lesson__stage-status"
                                aria-live="polite"
                            >
                                {pending
                                    ? 'Memeriksa jawaban'
                                    : running
                                      ? 'Robot bergerak'
                                      : 'Siap'}
                            </span>
                        </div>
                        <div className="blockly-lesson__stage-body">
                            {challenge ? (
                                <ChallengeBoard
                                    challenge={challenge}
                                    robot={robot ?? challenge.start}
                                />
                            ) : null}
                        </div>
                    </section>

                    <section className="blockly-lesson__mission">
                        <span className="blockly-lesson__eyebrow">Misi</span>
                        {step.content.objective ? (
                            <p>{step.content.objective}</p>
                        ) : null}
                        {challenge?.hint ? (
                            <div className="blockly-lesson__hint">
                                <Lightbulb size={17} aria-hidden="true" />
                                <span>{challenge.hint}</span>
                            </div>
                        ) : null}
                    </section>
                </aside>
            </div>
        </div>
    );
}
