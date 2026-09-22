import { Link } from '@inertiajs/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { home } from '@/routes';

export function Header() {
    return (
        <header className="border-b border-[#e2e8f0] bg-white dark:border-[#334563] dark:bg-[#0e1931]">
            <div className="mx-auto flex w-full max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-10 lg:px-[120px]">
                <Link
                    href={home.url()}
                    className="flex items-center gap-2.5 rounded-[12px] focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none"
                >
                    <span className="block size-11 overflow-hidden rounded-[12px]">
                        <img
                            src="/logo.jpeg"
                            alt=""
                            width={44}
                            height={44}
                            className="size-full object-cover"
                        />
                    </span>
                    <span className="font-display text-[22px] font-bold text-[#ff8a3d] sm:text-[30px]">
                        Zenuniverse
                    </span>
                </Link>
                <nav
                    aria-label="Navigasi utama"
                    className="flex items-center gap-4 sm:gap-7"
                >
                    <Link
                        href={home.url()}
                        className="text-[15px] font-bold text-[#1e293b] hover:text-[#ea6a12] focus-visible:rounded focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none dark:text-[#f4f6ff] dark:hover:text-[#ff8a3d]"
                    >
                        Beranda
                    </Link>
                    <span className="flex items-center gap-2 text-[15px] font-bold text-[#475569] dark:text-[#afc1dc]">
                        Blog
                        <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#ea6a12] dark:bg-[#162440] dark:text-[#ff8a3d]">
                            Segera hadir
                        </span>
                    </span>
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
