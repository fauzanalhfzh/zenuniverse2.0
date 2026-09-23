import { Head, Link } from '@inertiajs/react';
import { BookOpen, LogOut, Trophy, UserRound } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import MissionMap from '@/components/dashboard/mission-map';
import { ApiClient } from '@/lib/progress/client';
import { dashboard, home, leaderboard, logout } from '@/routes';
import { index as learnIndex } from '@/routes/learn';
import { show as profileShow } from '@/routes/profile';
import type {
    CourseCatalogItem,
    CourseDetail,
    ProgressSnapshot,
} from '@/types/lesson';

export default function Dashboard({
    courses,
    active,
}: {
    courses: CourseCatalogItem[];
    active: CourseDetail | null;
}) {
    const content = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = content.current;
        if (!element) return;
        function scrollHorizontally(event: WheelEvent) {
            if (
                event.ctrlKey ||
                Math.abs(event.deltaX) >= Math.abs(event.deltaY)
            )
                return;
            const target =
                event.target instanceof Element
                    ? event.target.closest<HTMLElement>('.mission-track')
                    : null;
            const delta =
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? element!.clientWidth
                      : 1);
            const scroller =
                target &&
                ((delta > 0 &&
                    target.scrollLeft <
                        target.scrollWidth - target.clientWidth - 1) ||
                    (delta < 0 && target.scrollLeft > 0))
                    ? target
                    : element!;
            if (scroller.scrollWidth <= scroller.clientWidth) return;
            event.preventDefault();
            scroller.scrollLeft += delta;
        }
        element.addEventListener('wheel', scrollHorizontally, {
            passive: false,
        });
        return () => element.removeEventListener('wheel', scrollHorizontally);
    }, []);
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
                <aside className="dashboard-sidebar">
                    <Link
                        href={home.url()}
                        className="dashboard-brand"
                        aria-label="ZenUniverse, beranda"
                    >
                        <img
                            src="/logo.jpeg"
                            alt=""
                            className="size-9 rounded-lg object-cover"
                        />
                        <span className="font-display text-lg font-semibold">
                            ZenUniverse
                        </span>
                    </Link>
                    <nav aria-label="Navigasi utama" className="dashboard-nav">
                        <Link
                            href={dashboard.url(
                                active
                                    ? { query: { course: active.id } }
                                    : undefined,
                            )}
                            aria-current="page"
                            aria-label="Peta misi"
                        >
                            <BookOpen aria-hidden="true" />
                            <span>Peta misi</span>
                        </Link>
                        <Link href={leaderboard.url()} aria-label="Papan skor">
                            <Trophy aria-hidden="true" />
                            <span>Papan skor</span>
                        </Link>
                        <Link
                            href={profileShow.url()}
                            aria-label="Profil penjelajah"
                        >
                            <UserRound aria-hidden="true" />
                            <span>Profil penjelajah</span>
                        </Link>
                        <Link href={learnIndex.url()} aria-label="Pilih kursus">
                            <BookOpen aria-hidden="true" />
                            <span>Pilih kursus</span>
                        </Link>
                    </nav>
                    <div className="dashboard-level">
                        <p className="font-display text-lg">Peta belajarmu</p>
                        {progress && !progressError ? (
                            <>
                                <progress
                                    value={progress.level.percent}
                                    max={100}
                                    aria-label="Progres level"
                                />
                                <p>
                                    Level {progress.level.current.level} ·{' '}
                                    {progress.level.current.name}
                                </p>
                            </>
                        ) : (
                            <p>
                                {progressLoading
                                    ? 'Memuat level...'
                                    : 'Level belum tersedia.'}
                            </p>
                        )}
                    </div>
                    <Link
                        href={logout.url()}
                        method="post"
                        as="button"
                        className="dashboard-logout"
                        aria-label="Keluar"
                    >
                        <LogOut aria-hidden="true" />
                        <span>Keluar</span>
                    </Link>
                </aside>
                <div className="dashboard-workspace">
                    <header className="dashboard-topbar">
                        <h1 className="font-display text-2xl font-medium">
                            Peta misimu
                        </h1>
                        <nav
                            aria-label="Pilih jalur belajar"
                            className="dashboard-courses"
                        >
                            {courses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={dashboard.url({
                                        query: { course: course.id },
                                    })}
                                    aria-current={
                                        active?.id === course.id
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {course.title}
                                </Link>
                            ))}
                        </nav>
                    </header>
                    <div className="dashboard-content" ref={content}>
                        {active ? (
                            <MissionMap key={active.id} course={active} />
                        ) : (
                            <section className="p-6">
                                <h2>Belum ada jalur aktif</h2>
                                <Link
                                    href={learnIndex.url()}
                                    className="mission-start mt-4"
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
                                        className="mission-start mt-4"
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
                                                label: 'Total XP',
                                                value: progress.totalXp.toLocaleString(
                                                    'id-ID',
                                                ),
                                            },
                                            {
                                                image: 'streak',
                                                label: 'Hari beruntun',
                                                value: `${progress.currentStreak}`,
                                            },
                                            {
                                                image: 'heart',
                                                label: 'Nyawa',
                                                value: `${progress.hearts}/${progress.heartsCapacity}`,
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
                                    <section className="dashboard-stat-card">
                                        <h2 className="font-display text-xl">
                                            Misi harian
                                        </h2>
                                        <div className="mt-5 flex items-center gap-3">
                                            <img
                                                src="/images/stats/star-xp.png"
                                                alt=""
                                                className="size-10 object-contain"
                                            />
                                            <div>
                                                <p>Kumpulkan XP</p>
                                                <p className="text-sm text-[#c0c9df]">
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
                                                </p>
                                            </div>
                                        </div>
                                        <progress
                                            value={progress.dailyGoal.percent}
                                            max={100}
                                            aria-label="Target XP harian"
                                        />
                                        <p className="mt-3 text-sm text-[#c0c9df]">
                                            {progress.dailyGoal.claimed
                                                ? 'Target harianmu sudah tercapai.'
                                                : progress.dailyGoal.remaining >
                                                    0
                                                  ? `${progress.dailyGoal.remaining} XP lagi untuk mencapai target.`
                                                  : 'Target XP tercapai.'}
                                        </p>
                                    </section>
                                </>
                            ) : (
                                <p>Belum ada statistik untuk ditampilkan.</p>
                            )}
                            <section className="dashboard-stat-card">
                                <p className="mission-eyebrow">Papan skor</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <img
                                        src="/images/stats/trophy.png"
                                        alt=""
                                        className="size-12 object-contain"
                                    />
                                    <h2 className="font-display text-xl">
                                        Para penjelajah
                                    </h2>
                                </div>
                                <Link
                                    href={leaderboard.url()}
                                    className="dashboard-ranking-link"
                                >
                                    Lihat papan skor
                                </Link>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
