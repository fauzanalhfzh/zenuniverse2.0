import type { CSSProperties } from 'react';
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
    robot,
}: {
    challenge: BlocklyChallengeConfig;
    robot: GridPosition & { direction: RobotDirection };
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
            className="challenge-board"
            style={
                {
                    gridTemplateColumns: `repeat(${challenge.board.width}, minmax(0, 1fr))`,
                    '--board-width': challenge.board.width,
                } as CSSProperties
            }
            role="img"
            aria-label={`Papan tantangan robot. Posisi ${robot.x + 1}, ${robot.y + 1}, menghadap ${robot.direction}`}
        >
            <div
                className="challenge-board__actor"
                style={
                    {
                        '--robot-x': robot.x,
                        '--robot-y': robot.y,
                    } as CSSProperties
                }
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 24 24"
                    className="challenge-board__robot"
                    style={{
                        transform: `rotate(${rotation[robot.direction]}deg)`,
                    }}
                >
                    <polygon
                        points="12,3 20,21 12,16 4,21"
                        fill="currentColor"
                    />
                </svg>
            </div>
            {cells.map((cell) => {
                const id = key(cell);
                const isGoal = id === goal;
                const isObstacle = obstacles.has(id);
                const isStart = id === start;

                return (
                    <div
                        key={id}
                        className={`challenge-board__cell ${
                            isObstacle ? 'challenge-board__cell--obstacle' : ''
                        } ${isGoal ? 'challenge-board__cell--goal' : ''} ${
                            isStart ? 'challenge-board__cell--start' : ''
                        }`}
                    >
                        {isGoal ? (
                            <span className="challenge-board__goal">★</span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
