import { Link, usePage } from '@inertiajs/react';
import { BrainCircuit } from 'lucide-react';
import { PublicSeo } from '@/components/public-seo';
import { primaryCtaClassName } from '@/components/landing/primary-cta';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { dashboard, login } from '@/routes';
import type { CourseCatalogItem } from '@/types/lesson';

const courseIcons: Record<string, string> = {
    'blockly-basics': 'code-block',
    'python-fundamentals': 'python',
    'javascript-fundamentals': 'javascript',
    'html-fundamentals': 'html',
    'css-fundamentals': 'css',
};

const paths = [
    {
        title: 'Mulai coding',
        subtitle: 'Dari blok visual ke baris kode.',
        description:
            'Kenali blok visual, lalu beralih ke bahasa pemrograman berbasis teks.',
        cta: 'Pilih jalur coding',
        steps: [
            {
                id: 'blockly-basics',
                title: 'Susun blok',
                description: 'Gabungkan blok jadi perintah.',
            },
            {
                id: 'python-fundamentals',
                title: 'Tulis kode',
                description: 'Buat program dengan Python.',
            },
            {
                id: 'javascript-fundamentals',
                title: 'Latih logika',
                description: 'Coba logika di JavaScript.',
            },
        ],
    },
    {
        title: 'Bikin website',
        subtitle: 'Dari halaman kosong ke web buatanmu.',
        description: 'Pelajari struktur halaman, tampilan, lalu interaksinya.',
        cta: 'Pilih jalur website',
        steps: [
            {
                id: 'html-fundamentals',
                title: 'Buat halaman',
                description: 'Isi halaman dengan teks dan gambar.',
            },
            {
                id: 'css-fundamentals',
                title: 'Beri warna',
                description: 'Atur warna dan tata letaknya.',
            },
            {
                id: 'javascript-fundamentals',
                title: 'Belajar logika',
                description: 'Kenali fungsi di JavaScript.',
            },
        ],
    },
];

const focus =
    'focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#4338ca]';

export default function Modul({ courses }: { courses: CourseCatalogItem[] }) {
    const { auth } = usePage().props;
    const courseHref = (id: string) => {
        const next = dashboard.url({ query: { course: id } });
        return auth.user ? next : login.url({ query: { next } });
    };
    const availablePaths = paths
        .map((path) => ({
            ...path,
            steps: path.steps.flatMap((step) => {
                const course = courses.find(
                    (course) =>
                        course.id === step.id &&
                        course.accessTier === 'free' &&
                        course.lessonCount > 0,
                );
                return course ? [{ ...step, course }] : [];
            }),
        }))
        .filter(
            (path, index) => path.steps.length === paths[index].steps.length,
        );

    return (
        <>
            <PublicSeo />
            <a
                href="#konten"
                className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3 focus:text-[#0f172a] ${focus}`}
            >
                Lewati ke konten utama
            </a>
            <Header />
            <main
                id="konten"
                className="bg-white text-[#0f172a] dark:bg-[#0b1429] dark:text-[#f4f6ff]"
            >
                <section className="mx-auto max-w-300 px-5 pt-14 pb-16 text-center sm:px-10 sm:pt-20 sm:pb-24">
                    <p className="font-bold text-[#a6400a] dark:text-[#ff8a3d]">
                        Roadmap
                    </p>
                    <h1 className="font-display mt-3 text-4xl font-bold sm:text-[52px] sm:leading-tight">
                        Pilih yang kamu suka
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg dark:text-[#afc1dc]">
                        Mau belajar fundamental coding atau langsung bikin
                        website? Mulai di sini.
                    </p>
                </section>

                <section
                    id="roadmap"
                    aria-labelledby="roadmap-title"
                    className="mx-auto max-w-300 scroll-mt-6 px-5 pb-16 sm:px-10 sm:pb-20"
                >
                    <h2
                        id="roadmap-title"
                        className="font-display max-w-xl text-3xl leading-tight font-bold sm:text-[46px]"
                    >
                        Dari langkah pertama,
                        <br />
                        sampai bisa bikin sendiri.
                    </h2>
                    <p className="mt-4 text-[#475569] sm:text-lg dark:text-[#afc1dc]">
                        Pilih jalurmu. Ikuti urutannya, satu per satu.
                    </p>
                    <p className="mt-2 text-sm text-[#475569] dark:text-[#afc1dc]">
                        Urutan belajar yang disarankan. Modul gratis yang sudah
                        terbit ditampilkan di sini.
                    </p>
                    {availablePaths.length === 0 && (
                        <p className="mt-6 text-[#475569] dark:text-[#afc1dc]">
                            Modul jalur belum lengkap. Pilih modul yang tersedia
                            di bawah.
                        </p>
                    )}
                    <div className="mt-8 flex flex-col gap-6">
                        {availablePaths.map((path) => (
                            <article
                                key={path.title}
                                className="grid rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] md:grid-cols-[240px_1fr] dark:border-[#334563] dark:bg-[#162440]"
                            >
                                <div className="flex flex-col gap-4 rounded-t-2xl bg-[#ff8a3d] p-6 text-[#0f172a] md:rounded-l-2xl md:rounded-tr-none">
                                    <h3 className="font-display text-3xl font-bold sm:text-[40px] sm:leading-tight">
                                        {path.title}
                                    </h3>
                                    <p className="text-lg font-semibold">
                                        {path.subtitle}
                                    </p>
                                    <p className="text-sm leading-6">
                                        {path.description}
                                    </p>
                                    <Link
                                        href={courseHref(path.steps[0].id)}
                                        className={`${primaryCtaClassName} mt-auto h-auto min-h-[54px] py-3 text-center`}
                                    >
                                        {path.cta}
                                    </Link>
                                </div>
                                <ol className="grid gap-7 p-6 sm:grid-cols-3 sm:gap-4 lg:p-8">
                                    {path.steps.map((step, index) => (
                                        <li
                                            key={step.id}
                                            className="relative flex min-w-0 flex-col items-start gap-3"
                                        >
                                            {index < path.steps.length - 1 && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute top-5 left-10 hidden h-0.5 w-full bg-[#ff8a3d] sm:block"
                                                />
                                            )}
                                            <span className="relative grid size-10 place-items-center rounded-full bg-[#ff8a3d] text-lg font-bold text-[#0f172a]">
                                                {index + 1}
                                            </span>
                                            <h4 className="font-display text-xl font-bold lg:text-2xl">
                                                {step.title}
                                            </h4>
                                            <p className="text-sm leading-6 text-[#475569] dark:text-[#afc1dc]">
                                                {step.description}
                                            </p>
                                            <Link
                                                href={courseHref(step.id)}
                                                className={`mt-auto inline-flex min-h-11 items-center rounded text-sm font-bold underline decoration-[#ff8a3d] underline-offset-4 ${focus}`}
                                            >
                                                {step.course.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    aria-labelledby="modules-title"
                    className="bg-[#f5f7fc] py-12 sm:py-16 dark:bg-[#111e36]"
                >
                    <div className="mx-auto max-w-300 px-5 sm:px-10">
                        <h2
                            id="modules-title"
                            className="font-display text-3xl font-bold sm:text-[40px]"
                        >
                            Atau, pilih modulmu sendiri.
                        </h2>
                        <p className="mt-3 text-[#475569] sm:text-lg dark:text-[#afc1dc]">
                            Langsung ke topik yang bikin kamu penasaran.
                        </p>
                        {courses.length === 0 ? (
                            <p className="mt-8 rounded-xl border border-[#cbd5e1] bg-white p-6 text-[#475569] dark:bg-[#162440] dark:text-[#afc1dc]">
                                Belum ada modul yang diterbitkan. Kembali lagi
                                nanti untuk memilih modul.
                            </p>
                        ) : (
                            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {courses.map((course) => (
                                    <article
                                        key={course.id}
                                        className="flex min-w-0 flex-col items-start rounded-2xl border border-[#e2e8f0] bg-white p-6 dark:border-[#334563] dark:bg-[#162440]"
                                    >
                                        {course.id === 'ai-fundamentals' ? (
                                            <BrainCircuit
                                                className="size-14 text-[#243552] dark:text-[#afc1dc]"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            courseIcons[course.id] && (
                                                <img
                                                    src={`/images/course-icon/${courseIcons[course.id]}.png`}
                                                    alt=""
                                                    width={56}
                                                    height={56}
                                                    className="size-14 object-contain"
                                                />
                                            )
                                        )}
                                        <h3 className="font-display mt-4 text-2xl font-bold">
                                            {course.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-[#afc1dc]">
                                            {course.description}
                                        </p>
                                        <p className="mt-3 text-sm font-semibold text-[#475569] dark:text-[#afc1dc]">
                                            {course.accessTier === 'plus'
                                                ? 'ZenPlus'
                                                : 'Gratis'}
                                        </p>
                                        <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-3 pt-6">
                                            <span className="text-xs text-[#475569] dark:text-[#afc1dc]">
                                                {course.lessonCount > 0
                                                    ? 'Misi bertahap'
                                                    : 'Belum ada misi'}
                                            </span>
                                            <Link
                                                href={courseHref(course.id)}
                                                aria-label={`Pilih modul ${course.title}`}
                                                className={`${primaryCtaClassName} h-auto min-h-[54px] py-3 text-center`}
                                            >
                                                Pilih modul
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer compact />
        </>
    );
}
