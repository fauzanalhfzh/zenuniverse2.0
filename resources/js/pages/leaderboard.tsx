import { Head } from '@inertiajs/react';
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';
import type { LeaderboardProps } from '@/types/profile';

export default function Leaderboard(props: LeaderboardProps) {
    return (
        <>
            <Head title="Papan Peringkat | ZenUniverse" />
            <main className="w-full px-4 py-10">
                <LeaderboardView board={props} />
            </main>
        </>
    );
}
