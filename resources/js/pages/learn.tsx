import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Braces,
    ChevronRight,
    Code2,
    LockKeyhole,
    LogOut,
    Rocket,
    Sparkles,
    Star,
    Trophy,
} from 'lucide-react';
import { dashboard, home, logout } from '@/routes';
import type { CourseCatalogItem } from '@/types/lesson';

interface AuthUser {
    id: number;
    name: string;
}

const courseAppearance = [
    {
        icon: Braces,
        color: 'text-[#63a8ff]',
        surface: 'bg-[#132b50]',
        label: 'Mulai misi',
    },
    {
        icon: Code2,
        color: 'text-[#a979ff]',
        surface: 'bg-[#281b55]',
        label: 'Mulai misi',
    },
    {
        icon: Sparkles,
        color: 'text-[#f04b9b]',
        surface: 'bg-[#491944]',
        label: 'Mulai misi',
    },
    {
        icon: Code2,
        color: 'text-[#4dd48d]',
        surface: 'bg-[#123d35]',
        label: 'Lanjut belajar',
    },
    {
        icon: Rocket,
        color: 'text-[#ff8a3d]',
        surface: 'bg-[#4a2915]',
        label: 'Lanjut belajar',
    },
];

export default function Learn({ courses }: { courses: CourseCatalogItem[] }) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;

    return (
        <>
            <Head title="Pilih Kursus | ZenUniverse" />
            <main className="min-h-svh bg-[#07152e] text-[#edf4ff]">
                <div className="mx-auto grid min-h-svh max-w-[1440px] lg:grid-cols-[230px_minmax(0,1fr)]">
                    <aside className="border-[#21395e] bg-[#0a1833] p-5 lg:border-r">
                        <Link
                            href={home.url()}
                            className="flex items-center gap-2 rounded-xl focus-visible:ring-3 focus-visible:ring-[#ff8a3d] focus-visible:outline-none"
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
                        <nav
                            aria-label="Navigasi belajar"
                            className="mt-10 flex gap-2 overflow-x-auto lg:flex-col"
                        >
                            <Link
                                href={dashboard.url()}
                                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#a9bcda] hover:bg-[#152a4b] hover:text-white"
                            >
                                <BookOpen
                                    className="size-4"
                                    aria-hidden="true"
                                />{' '}
                                Peta misi
                            </Link>
                            <Link
                                href="/leaderboard"
                                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#a9bcda] hover:bg-[#152a4b] hover:text-white"
                            >
                                <Trophy className="size-4" aria-hidden="true" />{' '}
                                Papan skor
                            </Link>
                            <Link
                                href="/profile"
                                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#a9bcda] hover:bg-[#152a4b] hover:text-white"
                            >
                                <Star className="size-4" aria-hidden="true" />{' '}
                                Profil penjelajah
                            </Link>
                        </nav>
                        <div className="mt-10 rounded-xl border border-[#264267] bg-[#0d2040] p-4">
                            <p className="text-xs font-semibold tracking-[0.16em] text-[#7f9bc3] uppercase">
                                Penjelajah
                            </p>
                            <p className="font-display mt-2 truncate text-lg">
                                {auth.user?.name ?? 'Penjelajah'}
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#203b61]">
                                <div className="h-full w-2/5 rounded-full bg-[#ff8a3d]" />
                            </div>
                            <p className="mt-2 text-xs text-[#a9bcda]">
                                Level 1 · Mulai petualangan
                            </p>
                        </div>
                        <Link
                            href={logout.url()}
                            method="post"
                            as="button"
                            className="mt-8 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#a9bcda] hover:bg-[#152a4b] hover:text-white"
                        >
                            <LogOut className="size-4" aria-hidden="true" />{' '}
                            Keluar
                        </Link>
                    </aside>

                    <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-11">
                        <header className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold tracking-[0.16em] text-[#ffb279] uppercase">
                                    Jalur petualangan
                                </p>
                                <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
                                    Pilih planetmu
                                </h1>
                                <p className="mt-2 text-sm text-[#a9bcda]">
                                    Selesaikan pelajaran untuk membuka jalur
                                    baru di ZenUniverse.
                                </p>
                            </div>
                            <Link
                                href={dashboard.url()}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#4b6387] px-4 text-sm font-semibold text-[#d7e5fb] hover:bg-[#152a4b]"
                            >
                                <ChevronRight
                                    className="size-4 rotate-180"
                                    aria-hidden="true"
                                />{' '}
                                Peta misi
                            </Link>
                        </header>

                        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {courses.map((course, index) => {
                                const appearance =
                                    courseAppearance[
                                        index % courseAppearance.length
                                    ];
                                const Icon = appearance.icon;
                                return (
                                    <Link
                                        key={course.id}
                                        href={dashboard.url({
                                            query: { course: course.id },
                                        })}
                                        className="group flex min-h-65 flex-col rounded-2xl border border-[#304b72] bg-[#0e2446] p-6 transition hover:-translate-y-1 hover:border-[#ff8a3d] hover:bg-[#132d55] focus-visible:ring-3 focus-visible:ring-[#ff8a3d] focus-visible:outline-none"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span
                                                className={`grid size-11 place-items-center rounded-full ${appearance.surface}`}
                                            >
                                                <Icon
                                                    className={`size-6 ${appearance.color}`}
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="rounded-full bg-[#143955] px-2 py-1 text-[10px] font-bold tracking-wide text-[#70ddb7] uppercase">
                                                Tersedia
                                            </span>
                                        </div>
                                        <h2 className="font-display mt-5 text-2xl font-medium text-white">
                                            {course.title}
                                        </h2>
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#a9bcda]">
                                            {course.description}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between pt-6">
                                            <span className="text-xs font-semibold text-[#7f9bc3]">
                                                {course.lessonCount} pelajaran
                                            </span>
                                            <span className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-[#ff8a3d] px-3 text-xs font-bold text-[#17223a] group-hover:bg-[#ffb279]">
                                                {appearance.label}
                                                <ChevronRight
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                            <article className="flex min-h-65 flex-col items-center justify-center rounded-2xl border border-dashed border-[#304b72] bg-[#0a1a35] p-6 text-center">
                                <span className="grid size-12 place-items-center rounded-full bg-[#132746]">
                                    <LockKeyhole
                                        className="size-5 text-[#7f9bc3]"
                                        aria-hidden="true"
                                    />
                                </span>
                                <h2 className="font-display mt-4 text-xl font-medium text-[#c9dbf6]">
                                    Jalur baru
                                </h2>
                                <p className="mt-2 max-w-52 text-sm leading-relaxed text-[#7f9bc3]">
                                    Siapkan pendaratanmu. Jalur petualangan lain
                                    segera hadir.
                                </p>
                                <span className="mt-5 rounded-full bg-[#162b4c] px-3 py-1 text-xs font-semibold text-[#a9bcda]">
                                    Segera hadir
                                </span>
                            </article>
                        </div>
                        <p className="mt-10 text-center text-xs text-[#647c9f]">
                            Pilih jalur yang ingin kamu jelajahi lebih dulu.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}
