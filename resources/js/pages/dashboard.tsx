import { Head, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { CourseCatalogItem, CourseDetail } from '@/types/lesson';

export default function Dashboard({
    courses,
    active,
}: {
    courses: CourseCatalogItem[];
    active: CourseDetail | null;
}) {
    return (
        <>
            <Head title="Dashboard | ZenUniverse" />
            <main className="mx-auto w-full max-w-5xl px-4 py-12">
                <h1 className="font-display text-4xl font-bold text-slate-900">
                    Dashboard belajar
                </h1>

                <div className="mt-8 flex flex-wrap gap-3">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/dashboard?course=${course.id}`}
                            className={cn(
                                'rounded-full border-2 px-4 py-2 text-sm font-bold',
                                active?.id === course.id
                                    ? 'border-primary bg-accent text-accent-foreground'
                                    : 'border-border hover:border-primary/60 bg-white text-slate-600',
                            )}
                        >
                            {course.title}
                        </Link>
                    ))}
                </div>

                {active ? (
                    <div className="mt-10 flex flex-col gap-8">
                        <header>
                            <h2 className="font-display text-3xl font-bold text-slate-900">
                                {active.title}
                            </h2>
                            <p className="mt-1 text-slate-600">
                                {active.description}
                            </p>
                        </header>

                        {active.units.map((unit) => (
                            <section
                                key={unit.id}
                                className="flex flex-col gap-3"
                            >
                                <h3 className="font-display text-xl font-bold text-slate-800">
                                    {unit.title}
                                </h3>
                                <ol className="flex flex-col gap-3">
                                    {unit.lessons.map((lesson) => (
                                        <li key={lesson.id}>
                                            <Link
                                                href={`/lesson/${lesson.id}`}
                                                aria-disabled={!lesson.unlocked}
                                                className={cn(
                                                    'flex items-center justify-between gap-4 rounded-2xl border-2 p-4',
                                                    lesson.unlocked
                                                        ? 'border-border hover:border-primary/60 bg-white'
                                                        : 'border-border bg-muted/40 pointer-events-none border-dashed opacity-70',
                                                )}
                                            >
                                                <span>
                                                    <span className="block font-bold text-slate-900">
                                                        {lesson.title}
                                                    </span>
                                                    <span className="block text-sm text-slate-500">
                                                        {lesson.description}
                                                    </span>
                                                </span>
                                                <span className="text-sm font-bold">
                                                    {lesson.completed
                                                        ? '✅ Selesai'
                                                        : lesson.unlocked
                                                          ? 'Mulai'
                                                          : '🔒 Terkunci'}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ))}
                    </div>
                ) : (
                    <p className="mt-10 text-slate-600">
                        Pilih kursus di atas untuk melihat daftar pelajaran.
                    </p>
                )}
            </main>
        </>
    );
}
