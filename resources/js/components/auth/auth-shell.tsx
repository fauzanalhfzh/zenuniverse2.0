import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '../ui/button';

interface AuthShellProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
    return (
        <main className="relative flex min-h-svh items-center justify-center bg-slate-950 px-4 py-10 sm:px-6 dark:bg-[#0b1429]">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <ThemeToggle />
            </div>
            <section
                aria-labelledby="auth-title"
                className="w-full max-w-md rounded-4xl border-4 border-slate-800 bg-white px-6 py-8 shadow-[0_10px_0_#0b1120] sm:px-10 sm:py-10 dark:border-[#334563] dark:bg-[#162440] dark:shadow-[0_10px_0_#070d1c]"
            >
                <Link
                    href="/"
                    className="mx-auto flex min-h-11 w-fit items-center gap-3 rounded-xl text-slate-900 focus-visible:ring-4 focus-visible:ring-[#9a3412] focus-visible:outline-none dark:text-[#f4f6ff]"
                >
                    <span className="block size-11 overflow-hidden rounded-xl">
                        <img
                            src="/logo.jpeg"
                            alt=""
                            width={44}
                            height={44}
                            className="size-full object-cover"
                        />
                    </span>
                    <span className="font-display text-2xl font-bold">
                        ZenUniverse
                    </span>
                </Link>

                <div className="mt-8 text-center">
                    <p className="font-display text-sm font-bold text-[#9a3412]">
                        Pusat kendali pelajar
                    </p>
                    <h1
                        id="auth-title"
                        className="font-display mt-2 text-3xl leading-tight font-bold text-slate-900 sm:text-4xl dark:text-[#f4f6ff]"
                    >
                        {title}
                    </h1>
                    <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-600 dark:text-[#afc1dc]">
                        {description}
                    </p>
                </div>

                <div className="mt-8">{children}</div>

                <Button href="/" variant="outline">
                    Kembali ke beranda
                </Button>
            </section>
        </main>
    );
}
