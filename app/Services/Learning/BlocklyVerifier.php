<?php

namespace App\Services\Learning;

/**
 * Deterministic robot simulation used to verify Blockly submissions without
 * running any submitted code on the server.
 */
class BlocklyVerifier
{
    private const DIRECTIONS = ['north', 'east', 'south', 'west'];

    private const MAX_BLOCKS = 500;

    private const MAX_VISITS = 10_000;

    private const MAX_DEPTH = 8;

    private const MAX_REPEAT = 100;

    private const MAX_EXECUTION_STEPS = 10_000;

    /**
     * @param  array<int, array<string, mixed>>  $commands
     * @param  array<string, mixed>  $challenge
     * @return array{success: bool, reason: ?string, hint: string, xp: int}
     */
    public static function evaluate(array $commands, array $challenge, int $rewardXp): array
    {
        $hint = (string) ($challenge['hint'] ?? '');

        $state = [
            'current' => [
                'position' => [
                    'x' => (int) $challenge['start']['x'],
                    'y' => (int) $challenge['start']['y'],
                ],
                'direction' => (string) $challenge['start']['direction'],
            ],
            'executed_steps' => 0,
            'visits' => 0,
            'failure' => null,
            'reached_goal' => false,
            'challenge' => $challenge,
        ];

        $state['reached_goal'] = self::isGoal($state['current']['position'], $challenge['goal']);

        $fail = static fn (string $reason): array => [
            'success' => false,
            'reason' => $reason,
            'hint' => $hint,
            'xp' => 0,
        ];

        if ($commands === []) {
            return $fail('empty_program');
        }

        $maxBlocks = min((int) ($challenge['maxBlocks'] ?? self::MAX_BLOCKS), self::MAX_BLOCKS);

        if (self::countBlocks($commands) > $maxBlocks) {
            return $fail('too_many_blocks');
        }

        foreach ($commands as $command) {
            self::execute($command, 0, $state);

            if ($state['failure'] !== null || $state['reached_goal']) {
                break;
            }
        }

        if ($state['reached_goal']) {
            return ['success' => true, 'reason' => null, 'hint' => $hint, 'xp' => $rewardXp];
        }

        return $fail((string) ($state['failure'] ?? 'goal_not_reached'));
    }

    /**
     * @param  array<string, mixed>  $command
     * @param  array<string, mixed>  $state
     */
    private static function execute(array $command, int $depth, array &$state): void
    {
        if ($state['failure'] !== null || $state['reached_goal']) {
            return;
        }

        $state['visits']++;

        if ($state['visits'] > self::MAX_VISITS || $depth > self::MAX_DEPTH) {
            $state['failure'] = 'step_limit';

            return;
        }

        $type = $command['type'] ?? null;

        if ($type === 'repeat') {
            $count = min((int) ($command['count'] ?? 0), self::MAX_REPEAT);
            $children = is_array($command['children'] ?? null) ? $command['children'] : [];

            for ($i = 0; $i < $count; $i++) {
                $state['visits']++;

                if ($state['visits'] > self::MAX_VISITS) {
                    $state['failure'] = 'step_limit';

                    return;
                }

                foreach ($children as $child) {
                    self::execute($child, $depth + 1, $state);

                    if ($state['failure'] !== null || $state['reached_goal']) {
                        return;
                    }
                }
            }

            return;
        }

        $maxExecution = min(
            (int) ($state['challenge']['maxExecutionSteps'] ?? self::MAX_EXECUTION_STEPS),
            self::MAX_EXECUTION_STEPS,
        );

        if ($state['executed_steps'] >= $maxExecution) {
            $state['failure'] = 'step_limit';

            return;
        }

        $state['executed_steps']++;

        if ($type === 'turn_right') {
            $index = array_search($state['current']['direction'], self::DIRECTIONS, true);
            $index = $index === false ? -1 : (int) $index;
            $state['current']['direction'] = self::DIRECTIONS[($index + 1) % 4];

            return;
        }

        $offsets = [
            'north' => ['x' => 0, 'y' => -1],
            'east' => ['x' => 1, 'y' => 0],
            'south' => ['x' => 0, 'y' => 1],
            'west' => ['x' => -1, 'y' => 0],
        ];

        $offset = $offsets[$state['current']['direction']] ?? ['x' => 0, 'y' => 0];
        $next = [
            'x' => $state['current']['position']['x'] + $offset['x'],
            'y' => $state['current']['position']['y'] + $offset['y'],
        ];

        $board = $state['challenge']['board'];

        if (
            $next['x'] < 0
            || $next['y'] < 0
            || $next['x'] >= $board['width']
            || $next['y'] >= $board['height']
        ) {
            $state['failure'] = 'out_of_bounds';

            return;
        }

        foreach (($state['challenge']['obstacles'] ?? []) as $obstacle) {
            if (self::isGoal($obstacle, $next)) {
                $state['failure'] = 'obstacle_hit';

                return;
            }
        }

        $state['current']['position'] = $next;

        if (self::isGoal($next, $state['challenge']['goal'])) {
            $state['reached_goal'] = true;
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $commands
     */
    private static function countBlocks(array $commands): int
    {
        $count = 0;
        $pending = $commands;

        while ($pending !== []) {
            $command = array_pop($pending);
            $count++;

            if ($count > self::MAX_BLOCKS) {
                return $count;
            }

            if (($command['type'] ?? null) === 'repeat') {
                foreach ((array) ($command['children'] ?? []) as $child) {
                    $pending[] = $child;
                }
            }
        }

        return $count;
    }

    /**
     * @param  array<string, mixed>  $position
     * @param  array<string, mixed>  $goal
     */
    private static function isGoal(array $position, array $goal): bool
    {
        return $position['x'] === $goal['x'] && $position['y'] === $goal['y'];
    }
}
