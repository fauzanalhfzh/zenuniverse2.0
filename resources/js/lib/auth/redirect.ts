const DEFAULT_AUTH_REDIRECT = '/dashboard';
const MAX_REDIRECT_LENGTH = 2048;

const protectedRoutePrefixes = [
    '/admin',
    '/dashboard',
    '/learn',
    '/lesson',
    '/profile',
    '/leaderboard',
];

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getSafeAuthRedirect(value: string | null | undefined): string {
    if (
        !value ||
        value.length > MAX_REDIRECT_LENGTH ||
        !value.startsWith('/') ||
        value.startsWith('//') ||
        value.includes('\\')
    ) {
        return DEFAULT_AUTH_REDIRECT;
    }

    try {
        const url = new URL(value, 'https://zenuniverse.invalid');

        if (url.origin !== 'https://zenuniverse.invalid') {
            return DEFAULT_AUTH_REDIRECT;
        }

        if (
            !protectedRoutePrefixes.some((prefix) =>
                matchesRoutePrefix(url.pathname, prefix),
            )
        ) {
            return DEFAULT_AUTH_REDIRECT;
        }

        return `${url.pathname}${url.search}`;
    } catch {
        return DEFAULT_AUTH_REDIRECT;
    }
}

export function getLoginHref(value: string | null | undefined): string {
    return `/login?next=${encodeURIComponent(getSafeAuthRedirect(value))}`;
}
