import { Head, Link } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';
import LearnerNavigation from '@/components/learner-navigation';
import { dashboard } from '@/routes';
import type { CourseCatalogItem } from '@/types/lesson';

const courseIcons: Record<string, string> = {
    'blockly-basics': 'code-block',
    'python-fundamentals': 'python',
    'javascript-fundamentals': 'javascript',
    'html-fundamentals': 'html',
    'css-fundamentals': 'css',
};

export default function Learn({ courses }: { courses: CourseCatalogItem[] }) {
    return (
        <>
            <Head title="Pilih Kursus | ZenUniverse" />
            <main className="dashboard-shell learn-shell">
                <LearnerNavigation active="courses" primary="courses" />

                <div className="dashboard-workspace learn-workspace">
                    <section className="mx-auto min-h-full w-full max-w-[1184px] px-5 py-8 pb-28 sm:px-8 lg:px-11 lg:pb-8">
                        <header>
                            <p className="text-[11px] font-bold tracking-[0.14em] text-[#a6400a] uppercase">
                                Jalur petualangan
                            </p>
                            <h1 className="font-display mt-1.5 text-3xl font-semibold sm:text-4xl">
                                Pilih planetmu
                            </h1>
                            <p className="mt-1.5 max-w-xl text-sm text-[#4a5a70] sm:text-[15px]">
                                Selesaikan pelajaran untuk membuka jalur baru di
                                ZenUniverse.
                            </p>
                        </header>

                        {courses.length > 0 ? (
                            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                                {courses.map((course) => {
                                    const icon =
                                        courseIcons[course.id] ?? 'code-block';

                                    return (
                                        <Link
                                            key={course.id}
                                            href={dashboard.url({
                                                query: { course: course.id },
                                            })}
                                            className="group flex min-h-[280px] min-w-0 flex-col rounded-[20px] border border-[#d4deea] bg-white p-6 transition-colors hover:border-[#ff8a3d] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#a6400a]"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <img
                                                    src={`/images/course-icon/${icon}.png`}
                                                    alt=""
                                                    className="size-16 rounded-xl object-cover"
                                                />
                                                <span className="rounded-full bg-[#e3f6ef] px-3 py-2 text-[10px] font-bold tracking-[0.08em] text-[#087a4f] uppercase">
                                                    Terbuka
                                                </span>
                                            </div>
                                            <h2 className="font-display mt-4 text-[22px] font-medium">
                                                {course.title}
                                            </h2>
                                            <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-[#4a5a70]">
                                                {course.description}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                                                <span className="text-xs text-[#5f6f85]">
                                                    {course.lessonCount}{' '}
                                                    pelajaran
                                                </span>
                                                <span className="inline-flex min-h-11 items-center rounded-xl bg-[#ff8a3d] px-[18px] text-sm font-bold text-[#172033] shadow-[3px_7px_0_#9c4913] transition-colors group-hover:bg-[#ed762c]">
                                                    Mulai
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}

                                <article className="flex min-h-[280px] flex-col items-center justify-center rounded-[20px] border border-[#c9d4e1] bg-[#eef3fa] p-6 text-center">
                                    <span className="grid size-11 place-items-center rounded-xl bg-[#e3eaf2] text-[#5f6f85]">
                                        <LockKeyhole
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <h2 className="font-display mt-4 text-xl font-medium text-[#5f6f85]">
                                        Jalur baru
                                    </h2>
                                    <p className="mt-2 max-w-56 text-[13px] leading-5 text-[#5f6f85]">
                                        Siapkan pendaratanmu. Jalur petualangan
                                        lain segera hadir.
                                    </p>
                                    <span className="mt-4 rounded-full bg-[#e3eaf2] px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-[#5f6f85] uppercase">
                                        Segera hadir
                                    </span>
                                </article>
                            </div>
                        ) : (
                            <section className="mt-8 rounded-[20px] border border-[#d4deea] bg-white p-8">
                                <h2 className="font-display text-xl font-medium">
                                    Belum ada kursus tersedia
                                </h2>
                                <p className="mt-2 text-sm text-[#4a5a70]">
                                    Kursus yang sudah diterbitkan akan muncul di
                                    sini.
                                </p>
                            </section>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
