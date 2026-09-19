<?php

namespace App\Support;

class Achievements
{
    /**
     * @return array<int, array{id: string, title: string, description: string, emoji: string, iconPath: string}>
     */
    public static function all(): array
    {
        return [
            [
                'id' => 'first-step',
                'title' => 'First Step',
                'description' => 'Selesaikan lesson pertamamu.',
                'emoji' => '🏆',
                'iconPath' => '/mission-icon/mission-xp.png',
            ],
            [
                'id' => 'block-master',
                'title' => 'Block Master',
                'description' => 'Selesaikan 1 block challenge.',
                'emoji' => '🧩',
                'iconPath' => '/course-icon/code block.png',
            ],
            [
                'id' => 'week-warrior',
                'title' => 'Week Warrior',
                'description' => 'Pertahankan streak 7 hari.',
                'emoji' => '🔥',
                'iconPath' => '/stats-icon/streak.png',
            ],
        ];
    }
}
