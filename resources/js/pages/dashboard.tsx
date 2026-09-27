import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import MissionMap from '@/components/dashboard/mission-map';
import LearnerNavigation from '@/components/learner-navigation';
import { ApiClient } from '@/lib/progress/client';
import { leaderboard } from '@/routes';
import { index as learnIndex } from '@/routes/learn';
import type { CourseDetail, ProgressSnapshot } from '@/types/lesson';

export default function Dashboard({ active }: { active: CourseDetail | null }) {
    const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
    const [progressLoading, setProgressLoading] = useState(true);
    const [progressError, setProgressError] = useState(false);
    const loadProgress = useCallback(async () => {
        setProgressLoading(true);
        setProgressError(false);
        try {
            setProgress(
                await new ApiClient().get<ProgressSnapshot>('/me/progress'),
            );
        } catch {
            setProgressError(true);
        } finally {
            setProgressLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProgress();
    }, [loadProgress]);

    return (
        <>
            <Head title="Peta misi | ZenUniverse" />
            <main className="dashboard-shell">
                <LearnerNavigation active="missions" />

                <div className="dashboard-workspace">
                    <header className="dashboard-mobile-stats">
                        {progress ? (
                            <>
                                <span>
                                    <img
                                        src="/images/stats/star-xp.png"
                                        alt=""
                                    />
                                    {progress.totalXp.toLocaleString('id-ID')}{' '}
                                    XP
                                </span>
                                <span>
                                    <img
                                        src="/images/stats/streak.png"
                                        alt=""
                                    />
                                    {progress.currentStreak}
                                </span>
                                <span>
                                    <img src="/images/stats/heart.png" alt="" />
                                    {progress.hearts}
                                </span>
                            </>
                        ) : (
                            <span role="status">
                                {progressLoading
                                    ? 'Memuat statistik...'
                                    : 'Statistik tidak tersedia'}
                            </span>
                        )}
                    </header>

                    <div className="dashboard-content">
                        {active ? (
                            <MissionMap key={active.id} course={active} />
                        ) : (
                            <section className="dashboard-empty">
                                <h1>Belum ada jalur aktif</h1>
                                <Link
                                    href={learnIndex.url()}
                                    className="mission-start"
                                >
                                    Pilih kursus
                                </Link>
                            </section>
                        )}

                        <aside
                            className="dashboard-stats"
                            aria-label="Statistik belajar"
                        >
                            {progressLoading ? (
                                <p role="status">
                                    Memuat statistik belajarmu...
                                </p>
                            ) : progressError ? (
                                <section className="dashboard-stat-card">
                                    <p role="alert">
                                        Statistik belum bisa dimuat.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void loadProgress()}
                                        className="mission-start"
                                    >
                                        Coba lagi
                                    </button>
                                </section>
                            ) : progress ? (
                                <>
                                    <section className="dashboard-stat-card dashboard-stat-totals">
                                        {[
                                            {
                                                image: 'star-xp',
                                                label: 'XP',
                                                value: progress.totalXp.toLocaleString(
                                                    'id-ID',
                                                ),
                                            },
                                            {
                                                image: 'streak',
                                                label: 'Hari streak',
                                                value: `${progress.currentStreak}`,
                                            },
                                            {
                                                image: 'heart',
                                                label: 'Nyawa',
                                                value: `${progress.hearts}`,
                                            },
                                        ].map((stat) => (
                                            <div key={stat.image}>
                                                <img
                                                    src={`/images/stats/${stat.image}.png`}
                                                    alt=""
                                                />
                                                <strong>{stat.value}</strong>
                                                <span>{stat.label}</span>
                                            </div>
                                        ))}
                                    </section>

                                    <section className="dashboard-stat-card dashboard-daily">
                                        <h2>Misi harian</h2>
                                        <div className="dashboard-quest">
                                            <img
                                                src="/images/stats/star-xp.png"
                                                alt=""
                                            />
                                            <div>
                                                <p>Kumpulkan XP</p>
                                                <progress
                                                    value={
                                                        progress.dailyGoal
                                                            .percent
                                                    }
                                                    max={100}
                                                    aria-label="Target XP harian"
                                                />
                                                <span>
                                                    {
                                                        progress.dailyGoal
                                                            .progress
                                                    }{' '}
                                                    /{' '}
                                                    {progress.dailyGoal
                                                        .progress +
                                                        progress.dailyGoal
                                                            .remaining}{' '}
                                                    XP
                                                </span>
                                            </div>
                                        </div>
                                        <p className="dashboard-daily-message">
                                            {progress.dailyGoal.claimed
                                                ? 'Target harianmu sudah tercapai.'
                                                : `${progress.dailyGoal.remaining} XP lagi untuk mencapai target.`}
                                        </p>
                                    </section>
                                </>
                            ) : null}

                            <section className="dashboard-stat-card dashboard-ranking">
                                <p className="mission-eyebrow">Papan skor</p>
                                <div>
                                    <img
                                        src="/images/stats/trophy.png"
                                        alt=""
                                    />
                                    <h2>Lihat peringkatmu</h2>
                                </div>
                                <p>Bandingkan XP-mu dengan penjelajah lain.</p>
                                <Link
                                    href={leaderboard.url()}
                                    className="dashboard-ranking-link"
                                >
                                    Lihat papan skor
                                </Link>
                            </section>

                            <section className="dashboard-stat-card dashboard-unlock">
                                <h2>Cara membuka misi</h2>
                                <p>
                                    Selesaikan misi aktif untuk membuka misi
                                    berikutnya.
                                </p>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
