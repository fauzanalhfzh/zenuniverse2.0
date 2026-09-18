import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import Galaxy from '@/components/Galaxy';
import { Button } from '@/components/ui/button';
import { useLoginModal } from '@/components/auth/login-provider';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap';

export function Hero() {
    const scope = useRef<HTMLDivElement>(null);
    const { openLogin } = useLoginModal();

    useGSAP(
        () => {
            ensureGsapRegistered();
            const media = gsap.matchMedia();

            media.add(
                {
                    desktop: '(min-width: 1024px)',
                    reduceMotion: '(prefers-reduced-motion: reduce)',
                },
                (context) => {
                    if (context.conditions?.reduceMotion) return;

                    const fromX = context.conditions?.desktop ? 36 : 0;

                    gsap.from('[data-hero-text] > *', {
                        x: fromX,
                        y: fromX === 0 ? 18 : 0,
                        autoAlpha: 0,
                        duration: 0.7,
                        stagger: 0.1,
                        ease: 'power2.out',
                    });

                    gsap.from('[data-hero-mascot]', {
                        x: context.conditions?.desktop ? -48 : 0,
                        y: context.conditions?.desktop ? 0 : 20,
                        scale: 0.96,
                        autoAlpha: 0,
                        duration: 0.8,
                        delay: 0.15,
                        ease: 'power2.out',
                    });
                },
            );

            return () => media.revert();
        },
        { scope },
    );

    return (
        <section
            id="hero"
            ref={scope}
            className="relative flex min-h-svh items-center overflow-hidden bg-slate-950 px-16 pt-32 pb-16 max-md:px-6 max-md:pt-28 max-md:pb-12"
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-80"
                aria-hidden="true"
            >
                <Galaxy
                    density={1.25}
                    starSpeed={0.35}
                    speed={0.65}
                    hueShift={18}
                    saturation={0.75}
                    glowIntensity={0.22}
                    twinkleIntensity={0.18}
                    rotationSpeed={0.035}
                    mouseInteraction={false}
                    mouseRepulsion={false}
                    transparent
                />
            </div>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-slate-950/55"
            />

            <div className="relative mx-auto grid w-full max-w-300 grid-cols-1 items-center gap-10 text-center lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:text-left">
                <div
                    data-hero-text
                    className="flex w-full flex-col items-center gap-5 lg:col-start-2 lg:row-start-1 lg:items-start"
                >
                    <p className="text-primary text-sm font-bold tracking-[2px] uppercase">
                        Gratis untuk anak Indonesia
                    </p>

                    <h1 className="font-display max-w-170 text-5xl/[1.08] font-bold text-white max-sm:text-4xl xl:text-6xl">
                        Cara paling seru{' '}
                        <span className="text-primary">belajar teknologi!</span>
                    </h1>

                    <p className="max-w-140 text-[19px] leading-normal text-slate-200">
                        Coding jadi gampang kayak main game. Mulai dari 0,
                        selesaikan misi, jadi astronot digital!
                    </p>

                    <div className="flex w-full max-w-110 flex-col gap-4 pt-3">
                        <Button
                            onClick={() => openLogin('/dashboard')}
                            className="bg-primary hover:bg-primary-dark min-h-14 w-full text-base text-white shadow-[3px_10px_0_#7c2d12] focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#9a3412]"
                        >
                            Mulai Belajar Gratis
                            <ArrowRight className="size-5" />
                        </Button>
                        <Button
                            href="#jalur-belajar"
                            variant="outline"
                            className="min-h-14 w-full border-slate-200 bg-white text-base text-slate-700"
                        >
                            Lihat Jalur Belajar
                        </Button>
                    </div>
                </div>

                <div
                    data-hero-mascot
                    className="mx-auto w-full max-w-115 lg:col-start-1 lg:row-start-1 lg:max-w-135"
                >
                    <img
                        src="/hero.png"
                        alt="Maskot astronot ZenUniverse memberi jempol sambil memegang laptop coding"
                        width={740}
                        height={720}
                        className="w-full object-cover"
                    />
                </div>
            </div>
        </section>
    );
}
