import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLoginModal } from '@/components/auth/login-provider';

const FALLBACK_SCROLL_PX = 320;

export function Header() {
    const [overHero, setOverHero] = useState(true);
    const { openLogin } = useLoginModal();

    useEffect(() => {
        const hero = document.getElementById('hero');

        if (hero) {
            const observer = new IntersectionObserver(
                ([entry]) => setOverHero(entry.isIntersecting),
                { threshold: 0 },
            );
            observer.observe(hero);
            return () => observer.disconnect();
        }

        function onScroll() {
            setOverHero(window.scrollY <= FALLBACK_SCROLL_PX);
        }

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 border-b-4 px-16 py-5 transition-[background-color,border-color,box-shadow] duration-300 max-md:px-4 max-md:py-3 ${
                overHero
                    ? 'border-transparent bg-transparent shadow-none'
                    : 'border-blue-50 bg-white shadow-[0_4px_0_rgba(0,0,0,0.1)]'
            }`}
        >
            <div className="mx-auto flex max-w-360 items-center justify-between gap-6">
                <Link
                    href="/"
                    className="focus-visible:ring-primary/70 flex items-center gap-2.5 rounded-xl focus-visible:ring-4 focus-visible:outline-none"
                >
                    <span className="block size-11 overflow-hidden rounded-xl">
                        <img
                            src="/logo.jpeg"
                            alt="ZenUniverse"
                            width={44}
                            height={44}
                            className="size-full object-cover"
                        />
                    </span>
                    <span className="font-display text-primary text-[26px] font-bold max-sm:hidden">
                        ZenUniverse
                    </span>
                </Link>
                <Button
                    onClick={() => openLogin('/dashboard')}
                    variant="primary"
                    className="px-12"
                >
                    Masuk
                </Button>
            </div>
        </header>
    );
}
