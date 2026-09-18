import { useRef } from 'react';
import {
    BookOpen,
    CheckCircle2,
    FlaskConical,
    MousePointerClick,
} from 'lucide-react';
import {
    ensureGsapRegistered,
    gsap,
    prefersReducedMotion,
    useGSAP,
} from '@/lib/gsap';

const methodPoints = [
    'Visual dulu, lihat animasi konsepnya',
    'Seret blok, susun kode seperti puzzle',
    'Langsung coba editor kode asli saat kamu siap',
    'Materi disusun oleh Software Engineer & Guru',
];

export function MetodeBelajar() {
    const scope = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            ensureGsapRegistered();
            gsap.from('[data-metode-panel]', {
                scrollTrigger: { trigger: scope.current, start: 'top 75%' },
                scale: 0.95,
                opacity: 0,
                duration: 0.7,
                ease: 'power2.out',
            });
        },
        { scope },
    );

    return (
        <section
            ref={scope}
            aria-labelledby="metode-belajar-title"
            className="overflow-hidden bg-white px-16 py-20 max-md:px-6 max-md:py-12"
        >
            <div className="mx-auto flex max-w-360 flex-col items-center gap-15 lg:flex-row lg:justify-between">
                <div className="flex w-full max-w-160 flex-col gap-6">
                    <p className="text-primary text-sm font-bold tracking-[2px] uppercase">
                        Metode Belajar
                    </p>
                    <h2
                        id="metode-belajar-title"
                        className="font-display text-4xl leading-[1.2] font-bold text-slate-800 max-sm:text-3xl"
                    >
                        Belajar yang gak bikin tegang
                    </h2>
                    <p className="text-[19px] leading-normal text-slate-500">
                        Kamu bakal ngerti coding lewat 3 cara: lihat visual,
                        main blok, langsung coba. Pelan-pelan, santai, tapi
                        pasti ngerti.
                    </p>
                    <ul className="flex flex-col gap-3.5">
                        {methodPoints.map((point) => (
                            <li
                                key={point}
                                className="flex items-center gap-2.5"
                            >
                                <CheckCircle2
                                    className="text-explorer size-5 shrink-0"
                                    strokeWidth={2.5}
                                />
                                <span className="text-base font-semibold text-slate-600">
                                    {point}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div
                    data-metode-panel
                    className="relative flex w-full max-w-135 items-center justify-center"
                >
                    <div
                        aria-hidden="true"
                        className="bg-accent absolute top-1/2 left-1/2 size-90 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    />
                    <img
                        src="/hero.png"
                        alt="Maskot astronot ZenUniverse sedang belajar coding"
                        width={520}
                        height={503}
                        loading="lazy"
                        className="relative w-full object-contain"
                    />
                    <span
                        aria-hidden="true"
                        className="absolute top-8 left-6 flex size-14 items-center justify-center rounded-2xl border-4 border-blue-50 bg-white shadow-[3px_6px_0_#e1e6ed]"
                    >
                        <FlaskConical
                            className="text-secondary size-7"
                            strokeWidth={2.25}
                        />
                    </span>
                    <span
                        aria-hidden="true"
                        className="absolute top-1/3 right-2 flex size-14 items-center justify-center rounded-2xl border-4 border-blue-50 bg-white shadow-[3px_6px_0_#e1e6ed]"
                    >
                        <BookOpen
                            className="text-primary size-7"
                            strokeWidth={2.25}
                        />
                    </span>
                    <span
                        aria-hidden="true"
                        className="absolute bottom-10 left-14 flex size-14 items-center justify-center rounded-2xl border-4 border-blue-50 bg-white shadow-[3px_6px_0_#e1e6ed]"
                    >
                        <MousePointerClick
                            className="text-explorer size-7"
                            strokeWidth={2.25}
                        />
                    </span>
                </div>
            </div>
        </section>
    );
}
