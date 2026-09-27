import { Head } from '@inertiajs/react';
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';
import LearnerNavigation from '@/components/learner-navigation';
import type { LeaderboardProps } from '@/types/profile';

export default function Leaderboard(props: LeaderboardProps) {
    return (
        <>
            <Head title="Papan Peringkat | ZenUniverse" />
            <main className="dashboard-shell learner-page-shell">
                <LearnerNavigation active="leaderboard" />

                <div className="dashboard-workspace learner-page-workspace">
                    <section className="mx-auto w-full max-w-3xl px-4 py-10 pb-28 sm:px-8 lg:pb-10">
                        <LeaderboardView board={props} />
                    </section>
                </div>
            </main>
        </>
    );
}
