import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { getGoogleSignInHref } from '@/lib/auth/oauth';

interface GoogleSignInButtonProps {
    nextPath?: string;
}

export function GoogleSignInButton({ nextPath }: GoogleSignInButtonProps) {
    const [pending, setPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSignIn() {
        setPending(true);
        setErrorMessage(null);

        try {
            window.location.assign(getGoogleSignInHref(nextPath));
        } catch {
            setErrorMessage(
                'Google belum dapat dibuka. Periksa koneksimu, lalu coba lagi.',
            );
            setPending(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Button
                type="button"
                onClick={handleSignIn}
                disabled={pending}
                aria-describedby={
                    errorMessage ? 'google-login-error' : undefined
                }
                className="bg-primary hover:bg-primary-dark min-h-14 w-full text-[#0b1429] shadow-[3px_8px_0_#7c2d12] focus-visible:ring-[#9a3412] dark:border-2 dark:border-[#334563] dark:bg-[#0e1931] dark:text-[#f4f6ff] dark:shadow-[3px_8px_0_#070d1c] dark:hover:bg-[#213250]"
            >
                {pending ? (
                    <>
                        <LoaderCircle
                            className="size-5 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                        />
                        Membuka Google...
                    </>
                ) : (
                    'Masuk dengan Google'
                )}
            </Button>

            {errorMessage ? (
                <div
                    id="google-login-error"
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-left text-sm leading-relaxed font-semibold text-red-900"
                >
                    <AlertCircle
                        className="mt-0.5 size-5 shrink-0"
                        aria-hidden="true"
                    />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
        </div>
    );
}
