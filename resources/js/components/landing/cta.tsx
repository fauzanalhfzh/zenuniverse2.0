import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useLoginModal } from '@/components/auth/login-provider';
import {
    ensureGsapRegistered,
    gsap,
    prefersReducedMotion,
    useGSAP,
} from '@/lib/gsap';

export function CTA() {
    const { openLogin } = useLoginModal();
    const scope = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            ensureGsapRegistered();
            gsap.from('[data-cta-card]', {
                scrollTrigger: { trigger: scope.current, start: 'top 80%' },
                scale: 0.9,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out',
            });
        },
        { scope },
    );

    return (
        <section
            ref={scope}
            className="bg-white px-16 py-20 max-md:px-6 max-md:py-12"
        >
            <div className="mx-auto flex max-w-360 flex-col items-center gap-6">
                <div
                    data-cta-card
                    className="flex w-full max-w-250 flex-col items-center gap-6 rounded-[56px] border-8 border-blue-50 bg-white px-20 py-16 max-md:px-6 max-md:py-12"
                >
                    <h2 className="font-display text-center text-5xl font-bold whitespace-pre-line text-slate-800 max-sm:text-4xl">
                        {'Siap Jadi\nHero Digital?'}
                    </h2>
                    <p className="max-w160 text-center text-xl font-bold text-slate-500">
                        Gabung sekarang. Gratis, tanpa kartu kredit, dan
                        langsung bisa main.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button
                            variant="primary"
                            onClick={() => openLogin('/dashboard')}
                        >
                            Masuk dengan Google
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
