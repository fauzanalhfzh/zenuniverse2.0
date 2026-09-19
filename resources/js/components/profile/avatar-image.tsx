import { cn } from '@/lib/utils';

export function AvatarImage({
    src,
    displayName,
    className,
    loading = 'lazy',
}: {
    src: string | null;
    displayName: string;
    className?: string;
    loading?: 'lazy' | 'eager';
}) {
    if (src) {
        return (
            <img
                src={src}
                alt={displayName}
                loading={loading}
                className={cn('object-cover', className)}
            />
        );
    }

    const initial = (displayName.trim().charAt(0) || 'Z').toUpperCase();

    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex items-center justify-center bg-slate-900 font-bold text-white',
                className,
            )}
        >
            {initial}
        </span>
    );
}
