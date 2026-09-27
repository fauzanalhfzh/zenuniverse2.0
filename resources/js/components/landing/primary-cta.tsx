import { Link, usePage } from '@inertiajs/react';
import { login } from '@/routes';
import { index as learnIndex } from '@/routes/learn';

interface LandingAuthProps {
    auth?: { user?: { id: number } | null };
    [key: string]: unknown;
}

export const primaryCtaClassName =
    'inline-flex h-[54px] items-center justify-center rounded-[14px] bg-primary px-5 text-[17px] font-bold text-white shadow-[0_4px_0_#ea6a12] transition-colors hover:bg-[#ea6a12] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#4338ca]';

export function PrimaryCtaLink({ className = '' }: { className?: string }) {
    const { auth } = usePage<LandingAuthProps>().props;
    const href = auth?.user ? learnIndex.url() : login.url();

    return (
        <Link href={href} className={`${primaryCtaClassName} ${className}`}>
            Mulai Belajar
        </Link>
    );
}
