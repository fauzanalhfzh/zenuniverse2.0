import { Head, Link } from '@inertiajs/react';
import type { CourseCatalogItem } from '@/types/lesson';

export default function Learn({ courses }: { courses: CourseCatalogItem[] }) {
    return (
        <>
            <Head title="Jalur Belajar | ZenUniverse" />
            <main className="mx-auto w-full max-w-5xl px-4 py-12">
                <h1 className="font-display text-4xl font-bold text-slate-900">
                    Jalur belajar
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-slate-600">
                    Pilih kursus untuk melihat daftar pelajaran dan melanjutkan
                    progresmu.
                </p>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/dashboard?course=${course.id}`}
                            className="pixel-card flex flex-col gap-3 p-6 transition-transform hover:-translate-y-0.5"
                        >
                            <span className="text-primary text-xs font-bold tracking-[2px] uppercase">
                                {course.level}
                            </span>
                            <span className="font-display text-2xl font-bold text-slate-900">
                                {course.title}
                            </span>
                            <span className="leading-relaxed text-slate-600">
                                {course.description}
                            </span>
                            <span className="mt-2 text-sm font-bold text-slate-500">
                                {course.lessonCount} lesson
                            </span>
                        </Link>
                    ))}
                </div>
            </main>
        </>
    );
}
