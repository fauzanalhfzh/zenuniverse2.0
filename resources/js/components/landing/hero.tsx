import { Link } from '@inertiajs/react';
import { login } from '@/routes';
import { PrimaryCtaLink } from './primary-cta';

export function Hero() {
    return (
        <section className="bg-white">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-5 pt-10 pb-14 sm:px-10 xl:flex-row xl:gap-16 xl:px-[120px] xl:pt-16 xl:pb-[88px]">
                <div className="w-full max-w-[520px] shrink-0">
                    <img
                        src="/illustrations/hero-coding-explorers.svg"
                        alt="Ilustrasi dua penjelajah cilik menyusun blok kode warna-warni"
                        width={520}
                        height={500}
                        className="h-auto w-full"
                    />
                </div>
                <div className="flex w-full flex-1 flex-col items-center gap-7 text-center">
                    <h1 className="font-display text-[30px] leading-[1.18] font-semibold text-[#1e293b] sm:text-[38px] lg:text-[44px] lg:leading-[52px]">
                        Belajar coding jadi <br />
                        seru, satu misi <br />
                        setiap hari!
                    </h1>
                    <p className="max-w-[440px] text-[18px] leading-[27px] text-[#475569]">
                        Main, coba, dan temukan hal baru bersama ZenUniverse.
                    </p>
                    <div className="flex w-full max-w-[440px] flex-col gap-4 px-1 pt-2 sm:px-7">
                        <PrimaryCtaLink className="w-full" />
                        <Link
                            href={login.url()}
                            className="inline-flex h-[54px] w-full items-center justify-center rounded-[14px] border-2 border-[#e2e8f0] bg-white px-5 text-[16px] font-bold text-[#4338ca] shadow-[0_3px_0_#e2e8f0] hover:border-[#cbd5e1] focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none"
                        >
                            Aku Sudah Punya Akun
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
