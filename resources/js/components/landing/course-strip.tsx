import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    Blocks,
    Code2,
    FileCode2,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CourseCatalogItem {
    id: string;
    title: string;
    description: string;
    level: string;
    lessonCount: number;
}

const courseIcons: LucideIcon[] = [Blocks, Code2, FileCode2];

export function CourseStrip({ courses }: { courses: CourseCatalogItem[] }) {
    const firstCourseHref = courses[0]
        ? `/dashboard?course=${courses[0].id}`
        : '/learn';

    return (
        <section
            id="jalur-belajar"
            aria-labelledby="course-strip-title"
            className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-16"
        >
            <div className="mx-auto flex max-w-300 flex-col gap-10 md:gap-14">
                <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-14">
                    <div>
                        <p className="font-display text-primary mb-4 flex items-center gap-3 text-sm font-bold">
                            <span
                                aria-hidden="true"
                                className="bg-primary h-1 w-9 rounded-full"
                            />
                            Jalur belajar ZenUniverse
                        </p>
                        <h2
                            id="course-strip-title"
                            className="font-display max-w-180 text-4xl/[1.08] font-bold text-slate-900 sm:text-5xl/[1.06]"
                        >
                            Dari menyusun blok menuju menulis kode sendiri.
                        </h2>
                    </div>
                    <p className="max-w-150 text-lg leading-relaxed text-slate-600">
                        Kamu tidak perlu menghafal syntax di hari pertama.
                        Pelajari cara kerja instruksi lewat blok visual, lalu
                        bawa logika yang sama ke Python dan JavaScript. Pelajari
                        juga HTML dan CSS untuk membuat struktur dan tampilan
                        halaman web.
                    </p>
                </div>

                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:gap-8">
                    <article className="bg-primary relative min-w-0 overflow-hidden rounded-4xl p-6 text-white shadow-[6px_10px_0_#9c4913] sm:p-8 lg:p-10">
                        <div
                            aria-hidden="true"
                            className="absolute -top-16 -right-16 size-48 rounded-full border-28 border-white/5"
                        />
                        <div className="relative flex h-full flex-col">
                            <p className="font-display text-sm font-bold text-black">
                                Lompatan pertamamu
                            </p>
                            <h3 className="font-display mt-3 max-w-125 text-3xl/[1.12] font-bold sm:text-4xl/[1.1]">
                                Pahami logikanya sebelum sibuk dengan syntax.
                            </h3>
                            <p className="mt-4 max-w-135 text-base leading-relaxed text-black sm:text-lg">
                                Susun perintah seperti puzzle. Saat pola
                                pikirnya sudah masuk, bentuk yang sama akan
                                terasa lebih masuk akal sebagai kode.
                            </p>

                            <div className="my-8 grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] sm:gap-4">
                                <div className="min-w-0 rounded-[12px] border bg-white p-4 shadow-[3px_10px_0_#9c4913]">
                                    <p className="mb-3 text-xs font-bold text-black">
                                        Blok visual
                                    </p>
                                    <div className="bg-primary font-display rounded-xl p-3 font-bold text-black">
                                        ulangi 3 kali
                                        <div className="mt-2 rounded-lg bg-white/85 px-3 py-2 text-sm">
                                            maju
                                        </div>
                                    </div>
                                </div>

                                <ArrowDown
                                    aria-hidden="true"
                                    className="mx-auto size-6 text-black sm:hidden"
                                />
                                <ArrowRight
                                    aria-hidden="true"
                                    className="mx-auto hidden size-6 text-black sm:block"
                                />

                                <div className="min-w-0 rounded-2xl border bg-white p-4 shadow-[3px_10px_0_#9c4913]">
                                    <p className="mb-3 text-xs font-bold text-black">
                                        Kode Python
                                    </p>
                                    <pre className="bg-primary overflow-x-auto rounded-[12px] p-3 text-sm leading-relaxed font-bold text-black">
                                        <code>{`for i in range(3):\n    move_forward()`}</code>
                                    </pre>
                                </div>
                            </div>

                            <div className="mt-auto flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
                                <Button
                                    variant="outline"
                                    href={firstCourseHref}
                                >
                                    Mulai dari Code Block
                                </Button>
                                <p className="text-lg leading-relaxed font-bold text-white">
                                    Gratis, mulai dari level pemula.
                                </p>
                            </div>
                        </div>
                    </article>

                    <div className="min-w-0 rounded-4xl border-2 border-orange-100 bg-white p-5 sm:p-7 lg:p-8">
                        <div className="mb-6">
                            <h3 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                                Rute yang disarankan
                            </h3>
                            <p className="mt-2 leading-relaxed text-slate-600">
                                Pilih jalur sesuai tujuanmu. Untuk membuat
                                halaman web, mulai dari HTML lalu lanjutkan ke
                                CSS.
                            </p>
                        </div>

                        <div className="relative">
                            <span
                                aria-hidden="true"
                                className="absolute top-9 bottom-9 left-13 w-0.5 bg-orange-100"
                            />
                            <ol className="relative flex flex-col gap-3">
                                {courses.map((course, index) => {
                                    const CourseIcon =
                                        courseIcons[index % courseIcons.length];
                                    const href = `/dashboard?course=${course.id}`;

                                    return (
                                        <li
                                            key={course.id}
                                            className="relative min-w-0"
                                        >
                                            <Link
                                                href={href}
                                                className={`group grid min-h-30 min-w-0 grid-cols-[52px_minmax(0,1fr)] gap-4 rounded-2xl border-2 p-4 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-orange-300 focus-visible:ring-4 focus-visible:ring-[#9c4913] focus-visible:outline-none sm:p-5`}
                                            >
                                                <Button variant="outline">
                                                    <CourseIcon
                                                        className="size-6"
                                                        strokeWidth={2.25}
                                                    />
                                                </Button>

                                                <span className="min-w-0">
                                                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                                        <span className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                                                            {course.title}
                                                        </span>
                                                        <span className="text-primary text-xs font-bold">
                                                            Tahap {index + 1}
                                                        </span>
                                                    </span>
                                                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                                                        {course.description}
                                                    </span>
                                                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
                                                        <span>
                                                            {course.lessonCount}{' '}
                                                            lesson
                                                        </span>
                                                        <span aria-hidden="true">
                                                            •
                                                        </span>
                                                        <span>
                                                            {course.level}
                                                        </span>
                                                        <span className="text-primary underline decoration-orange-200 decoration-2 underline-offset-4 group-hover:decoration-orange-500">
                                                            Buka jalur
                                                        </span>
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <p className="mt-6 border-t border-slate-200 pt-5 text-sm leading-relaxed text-slate-600">
                            Saat kembali di perangkat yang sama, kamu bisa
                            melanjutkan dari progres terakhir.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
