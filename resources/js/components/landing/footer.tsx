import { Link } from '@inertiajs/react';

export function Footer() {
    return (
        <footer className="flex flex-col items-center justify-between gap-6 border-t-4 border-blue-100 bg-blue-50 px-16 py-10 max-md:px-6 md:flex-row">
            <Link href="/" className="flex items-center gap-2.5">
                <span className="block size-11 overflow-hidden rounded-xl">
                    <img
                        src="/logo.jpeg"
                        alt="ZenUniverse"
                        width={44}
                        height={44}
                        className="size-full object-cover"
                    />
                </span>
                <span className="font-display text-primary text-[26px] font-bold">
                    Zenuniverse
                </span>
            </Link>

            <p className="text-lg font-bold text-slate-500 max-md:text-center">
                © 2026 Zenuniverse. Belajar Asik Keliling Galaksi!
            </p>

            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-5">
                <span className="text-sm font-semibold text-slate-400 max-md:text-center">
                    Instagram &amp; YouTube sedang disiapkan
                </span>
            </div>
        </footer>
    );
}
