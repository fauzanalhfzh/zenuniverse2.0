import type {
    BlocklyChallengeConfig,
    GridPosition,
    RobotDirection,
} from '@/types/lesson';

const rotation: Record<RobotDirection, number> = {
    north: 0,
    east: 90,
    south: 180,
    west: 270,
};

function key(position: GridPosition): string {
    return `${position.x}:${position.y}`;
}

export function ChallengeBoard({
    challenge,
}: {
    challenge: BlocklyChallengeConfig;
}) {
    const obstacles = new Set((challenge.obstacles ?? []).map(key));
    const goal = key(challenge.goal);
    const start = key(challenge.start);
    const cells: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < challenge.board.height; y++) {
        for (let x = 0; x < challenge.board.width; x++) {
            cells.push({ x, y });
        }
    }

    return (
        <div
            className="grid gap-1 rounded-2xl bg-slate-900 p-2"
            style={{
                gridTemplateColumns: `repeat(${challenge.board.width}, minmax(0, 1fr))`,
            }}
            role="img"
            aria-label="Papan tantangan robot"
        >
            {cells.map((cell) => {
                const id = key(cell);
                const isGoal = id === goal;
                const isObstacle = obstacles.has(id);
                const isStart = id === start;

                return (
                    <div
                        key={id}
                        className={`relative flex aspect-square items-center justify-center rounded-lg ${
                            isObstacle ? 'bg-slate-700' : 'bg-slate-800'
                        }`}
                    >
                        {isGoal ? <span className="text-lg">⭐</span> : null}
                        {isStart ? (
                            <svg
                                viewBox="0 0 24 24"
                                className="size-6 text-sky-400"
                                style={{
                                    transform: `rotate(${rotation[challenge.start.direction]}deg)`,
                                }}
                                aria-hidden="true"
                            >
                                <polygon
                                    points="12,3 20,21 12,16 4,21"
                                    fill="currentColor"
                                />
                            </svg>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
