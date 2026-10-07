import { Link, usePage } from '@inertiajs/react';
import { login } from '@/routes';
import { index as learnIndex } from '@/routes/learn';

interface LandingAuthProps {
    auth?: { user?: { id: number } | null };
    [key: string]: unknown;
}

export const primaryCtaClassName =
    'inline-flex h-[54px] items-center justify-center rounded-[14px] bg-primary px-5 text-[17px] font-bold text-white shadow-[3px_10px_0_#9c4913] transition-[background-color,transform,box-shadow] hover:bg-[#ea6a12] active:translate-x-[2px] active:translate-y-[7px] active:shadow-[1px_3px_0_#9c4913] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#4338ca]';

export function PrimaryCtaLink({ className = '' }: { className?: string }) {
    const { auth } = usePage<LandingAuthProps>().props;
    const href = auth?.user ? learnIndex.url() : login.url();

    return (
        <Link href={href} className={`${primaryCtaClassName} ${className}`}>
            Mulai Belajar
        </Link>
    );
}
