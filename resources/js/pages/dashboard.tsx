import { Head, Link, usePage } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import MissionMap from '@/components/dashboard/mission-map';
import LearnerNavigation from '@/components/learner-navigation';
import { MotionAsset } from '@/components/motion/motion-asset';
import type { MotionAssetKind } from '@/components/motion/motion-asset';
import { useDashboardProgress } from '@/lib/progress/use-dashboard-progress';
import {
    SubscriptionProvider,
    useSubscription,
} from '@/lib/subscription/session';
import { leaderboard } from '@/routes';
import { index as learnIndex } from '@/routes/learn';
import type { CourseDetail } from '@/types/lesson';

export default function Dashboard({ active }: { active: CourseDetail | null }) {
    return (
        <SubscriptionProvider>
            <DashboardContent active={active} />
        </SubscriptionProvider>
    );
}

function DashboardContent({ active }: { active: CourseDetail | null }) {
    const subscription = useSubscription();
    const { progressPollMs } = usePage<{ progressPollMs?: number }>().props;
    const {
        progress,
        loading: progressLoading,
        error: progressError,
        refresh: loadProgress,
    } = useDashboardProgress(progressPollMs);
    useLayoutEffect(() => {
        const root = document.documentElement;
        const wasDark = root.classList.contains('dark');
        const previousColorScheme = root.style.colorScheme;
        root.classList.remove('dark');
        root.style.colorScheme = 'light';

        return () => {
            root.classList.toggle('dark', wasDark);
            root.style.colorScheme = previousColorScheme;
        };
    }, []);

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
                                    <MotionAsset
                                        kind="star"
                                        size={24}
                                        value={progress.totalXp}
                                    />
                                    {progress.totalXp.toLocaleString('id-ID')}{' '}
                                    XP
                                </span>
                                <span>
                                    <MotionAsset
                                        kind="streak"
                                        size={24}
                                        value={progress.currentStreak}
                                        active={progress.currentStreak > 0}
                                    />
                                    {progress.currentStreak}
                                </span>
                                <span>
                                    <MotionAsset
                                        kind={
                                            subscription.plusActive
                                                ? 'unlimited-heart'
                                                : 'heart'
                                        }
                                        size={24}
                                        value={progress.hearts}
                                        filled={
                                            subscription.plusActive ||
                                            progress.hearts > 0
                                        }
                                    />
                                    <span
                                        aria-label={
                                            subscription.plusActive
                                                ? 'Nyawa tanpa batas'
                                                : `Nyawa: ${progress.hearts}`
                                        }
                                    >
                                        {subscription.plusActive
                                            ? '∞'
                                            : progress.hearts}
                                    </span>
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
                            {progressLoading && !progress ? (
                                <p role="status">
                                    Memuat statistik belajarmu...
                                </p>
                            ) : progressError && !progress ? (
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
                                                kind: 'star',
                                                amount: progress.totalXp,
                                                label: 'XP',
                                                value: progress.totalXp.toLocaleString(
                                                    'id-ID',
                                                ),
                                            },
                                            {
                                                image: 'streak',
                                                kind: 'streak',
                                                amount: progress.currentStreak,
                                                label: 'Hari streak',
                                                value: `${progress.currentStreak}`,
                                            },
                                            {
                                                image: 'heart',
                                                kind: subscription.plusActive
                                                    ? 'unlimited-heart'
                                                    : 'heart',
                                                amount: progress.hearts,
                                                label: subscription.plusActive
                                                    ? 'Nyawa tanpa batas'
                                                    : 'Nyawa',
                                                value: subscription.plusActive
                                                    ? '∞'
                                                    : `${progress.hearts}`,
                                            },
                                        ].map((stat) => (
                                            <div key={stat.image}>
                                                <MotionAsset
                                                    kind={
                                                        stat.kind as MotionAssetKind
                                                    }
                                                    size={44}
                                                    value={stat.amount}
                                                    filled={
                                                        stat.kind ===
                                                            'unlimited-heart' ||
                                                        stat.amount > 0
                                                    }
                                                    active={
                                                        stat.kind !==
                                                            'streak' ||
                                                        stat.amount > 0
                                                    }
                                                />
                                                <strong>{stat.value}</strong>
                                                <span>{stat.label}</span>
                                            </div>
                                        ))}
                                    </section>

                                    <section className="dashboard-stat-card dashboard-daily">
                                        <h2>Misi harian</h2>
                                        <div className="dashboard-quest">
                                            <MotionAsset
                                                kind="star"
                                                size={44}
                                                value={
                                                    progress.dailyGoal.progress
                                                }
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
                                <MotionAsset
                                    kind="mascot"
                                    size={76}
                                    playOnMount
                                />
                                <div>
                                    <h2>Cara membuka misi</h2>
                                    <p>
                                        Selesaikan misi aktif untuk membuka misi
                                        berikutnya.
                                    </p>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
