import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleCheck } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { home } from '@/routes';

interface LoginProps {
    next?: string;
    signedOut?: boolean;
}

export default function Login({ next, signedOut = false }: LoginProps) {
    return (
        <>
            <Head title="Masuk | ZenUniverse" />
            <main className="min-h-svh bg-white text-[#1e293b] dark:bg-[#0b1429] dark:text-[#f4f6ff]">
                <header className="border-b border-[#e2e8f0] bg-white dark:border-[#334563] dark:bg-[#0e1931]">
                    <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-4 sm:px-10 lg:px-16">
                        <Link
                            href={home.url()}
                            className="flex items-center gap-2.5 rounded-xl focus-visible:ring-3 focus-visible:ring-[#4338ca] focus-visible:outline-none"
                        >
                            <img
                                src="/logo.jpeg"
                                alt=""
                                className="size-10 rounded-xl object-cover"
                            />
                            <span className="font-display text-2xl font-bold text-[#ff8a3d]">
                                ZenUniverse
                            </span>
                        </Link>
                        <Link
                            href={home.url()}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#475569] hover:text-[#ea6a12] focus-visible:ring-3 focus-visible:ring-[#4338ca] focus-visible:outline-none dark:text-[#afc1dc]"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />{' '}
                            Kembali
                        </Link>
                    </div>
                </header>

                <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-5 py-8 sm:px-10 lg:min-h-[calc(100svh-73px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.7fr)] lg:items-center lg:px-16">
                    <section className="relative overflow-hidden rounded-2xl bg-[#dff2ff] p-8 sm:p-12 dark:bg-[#162f52]">
                        <div className="max-w-md">
                            <p className="text-sm font-bold tracking-[0.16em] text-[#ea6a12] uppercase">
                                Kembali ke petualangan
                            </p>
                            <h1 className="font-display mt-4 text-4xl leading-[1.08] font-semibold tracking-tight text-[#1e293b] sm:text-5xl dark:text-[#f4f6ff]">
                                Satu misi lagi.
                                <br />
                                Satu langkah maju.
                            </h1>
                            <p className="mt-5 max-w-sm leading-relaxed text-[#475569] dark:text-[#c7d7ef]">
                                Lanjutkan perjalananmu, buka tantangan baru, dan
                                kumpulkan XP.
                            </p>
                        </div>
                        <img
                            src="/logo.jpeg"
                            alt="Maskot ZenUniverse"
                            className="mx-auto mt-10 size-44 rounded-3xl object-cover shadow-[0_14px_28px_rgb(30_41_59_/_0.18)] sm:ml-12 sm:size-52"
                        />
                        <p className="mt-10 text-xs font-semibold tracking-[0.13em] text-[#64748b] uppercase dark:text-[#afc1dc]">
                            Penjelajah · belajar sambil bermain
                        </p>
                    </section>

                    <section
                        aria-labelledby="login-title"
                        className="mx-auto w-full max-w-md py-4 lg:py-0"
                    >
                        <p className="text-sm font-semibold text-[#ea6a12]">
                            Selamat datang kembali.
                        </p>
                        <h2
                            id="login-title"
                            className="font-display mt-3 text-3xl font-semibold"
                        >
                            Masuk untuk lanjut belajar
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#64748b] dark:text-[#afc1dc]">
                            Gunakan akun Google yang sama setiap kali kamu
                            kembali ke ZenUniverse.
                        </p>
                        {signedOut ? (
                            <div
                                role="status"
                                className="mt-6 flex items-start gap-3 rounded-xl border border-[#8ae0bb] bg-[#effcf6] p-4 text-sm font-semibold text-[#187d60] dark:border-[#2d8a68] dark:bg-[#123728] dark:text-[#a9edcd]"
                            >
                                <CircleCheck
                                    className="mt-0.5 size-5 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>Kamu sudah keluar dari akun ini.</span>
                            </div>
                        ) : null}
                        <div className="mt-7">
                            <GoogleSignInButton nextPath={next} />
                        </div>
                        <p className="mt-6 text-center text-xs leading-relaxed text-[#64748b] dark:text-[#afc1dc]">
                            Tidak perlu membuat password baru.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}
