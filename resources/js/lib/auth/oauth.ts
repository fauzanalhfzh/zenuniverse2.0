import { getSafeAuthRedirect } from './redirect';

export function getGoogleSignInHref(value: string | null | undefined): string {
    return `/auth/google/redirect?next=${encodeURIComponent(getSafeAuthRedirect(value))}`;
}
