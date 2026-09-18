import { Head } from '@inertiajs/react';
import { CircleCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface LoginProps {
    next?: string;
    signedOut?: boolean;
}

export default function Login({ next, signedOut = false }: LoginProps) {
    return (
        <>
            <Head title="Masuk | ZenUniverse" />
            <AuthShell
                title="Masuk untuk lanjut belajar"
                description="Gunakan akun Google yang sama setiap kali kamu kembali ke ZenUniverse."
            >
                {signedOut ? (
                    <div
                        role="status"
                        className="mb-5 flex items-start gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-left text-sm leading-relaxed font-semibold text-green-900"
                    >
                        <CircleCheck
                            className="mt-0.5 size-5 shrink-0"
                            aria-hidden="true"
                        />
                        <span>Kamu sudah keluar dari akun ini.</span>
                    </div>
                ) : null}

                <GoogleSignInButton nextPath={next} />
            </AuthShell>
        </>
    );
}
