import type {
    BlocklyChallengeConfig,
    BlocklyCommand,
    RobotDirection,
} from '@/types/lesson';

type Frame = { x: number; y: number; direction: RobotDirection };

const directions: RobotDirection[] = ['north', 'east', 'south', 'west'];
const offsets = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };

export function previewRobot(
    commands: BlocklyCommand[],
    challenge: BlocklyChallengeConfig,
): Frame[] {
    const current: Frame = { ...challenge.start };
    const frames: Frame[] = [{ ...current }];
    const blocked = new Set(
        (challenge.obstacles ?? []).map(({ x, y }) => `${x}:${y}`),
    );
    let visits = 0;
    let executions = 0;
    let stopped = false;

    function execute(command: BlocklyCommand, depth: number): void {
        if (stopped || ++visits > 10000 || depth > 8) {
            stopped = true;
            return;
        }
        if (command.type === 'repeat') {
            for (let i = 0; i < Math.min(command.count, 100) && !stopped; i++) {
                if (++visits > 10000) {
                    stopped = true;
                    break;
                }
                for (const child of command.children) execute(child, depth + 1);
            }
            return;
        }
        // ponytail: preview shows at most 40 actions; server still verifies full program.
        if (
            executions++ >= Math.min(challenge.maxExecutionSteps, 40) ||
            frames.length >= 41
        ) {
            stopped = true;
            return;
        }
        if (command.type === 'turn_right') {
            current.direction =
                directions[(directions.indexOf(current.direction) + 1) % 4];
        } else {
            const [dx, dy] = offsets[current.direction];
            const x = current.x + dx;
            const y = current.y + dy;
            if (
                x < 0 ||
                y < 0 ||
                x >= challenge.board.width ||
                y >= challenge.board.height ||
                blocked.has(`${x}:${y}`)
            ) {
                stopped = true;
                return;
            }
            current.x = x;
            current.y = y;
        }
        frames.push({ ...current });
        if (current.x === challenge.goal.x && current.y === challenge.goal.y)
            stopped = true;
    }

    for (const command of commands) execute(command, 0);
    return frames;
}
