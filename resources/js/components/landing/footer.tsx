import { Link } from '@inertiajs/react';
import { home, login } from '@/routes';
import { CTA } from './cta';

const comingSoonLinks = ['Alur belajar', 'Mulai misi pertama'] as const;
const parentLinks = ['Panduan pendampingan', 'Kenali cara belajarnya'] as const;
const socials = [
    {
        label: 'Instagram',
        path: 'M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z',
    },
    {
        label: 'YouTube',
        path: 'M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z',
    },
] as const;

function ComingSoon({ label }: { label: string }) {
    return (
        <span className="flex flex-wrap items-center gap-2 text-[16px] leading-[22px] text-[#1e293b] dark:text-[#afc1dc]">
            {label}
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-[#0f172a] dark:hidden">
                Segera hadir
            </span>
        </span>
    );
}

function ColumnHeading({ children }: { children: string }) {
    return (
        <h2 className="font-display text-[18px] font-bold text-[#0f172a] dark:text-[#f4f6ff]">
            {children}
        </h2>
    );
}

export function Footer() {
    return (
        <footer className="bg-white dark:bg-[#0b1429]">
            <CTA />
            <div className="w-full overflow-hidden">
                <img
                    src="/illustrations/valley-explorers.svg"
                    alt="Ilustrasi lembah penuh penjelajah cilik, roket, dan bentuk belajar"
                    width={1440}
                    height={540}
                    className="h-auto w-full dark:hidden"
                />
                <img
                    src="/illustrations/valley-explorers-dark.svg"
                    alt=""
                    width={1440}
                    height={540}
                    className="hidden h-auto w-full dark:block"
                />
            </div>
            <div className="bg-[#ff8a3d] dark:bg-[#0e1930]">
                <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-10 sm:px-10">
                    <div className="flex flex-col gap-10 xl:flex-row xl:gap-14">
                        <div className="flex w-full max-w-[340px] flex-col gap-4">
                            <div className="flex items-center gap-2.5">
                                <span className="font-display text-[28px] font-bold text-[#0f172a] dark:text-[#ff8a3d]">
                                    Zenuniverse
                                </span>
                            </div>
                            <p className="text-[16px] leading-[24px] text-[#1e293b] dark:text-[#afc1dc]">
                                Belajar lewat misi kecil.
                                <br />
                                Tumbuh bersama rasa penasaran.
                            </p>
                            <div className="flex items-center gap-5 text-[#1e293b] dark:text-[#f4f6ff]">
                                {socials.map(({ label, path }) => (
                                    <svg
                                        key={label}
                                        viewBox="0 0 640 640"
                                        role="img"
                                        aria-label={label}
                                        className="size-[22px] fill-current"
                                    >
                                        <path d={path} />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-4">
                            <ColumnHeading>Mulai belajar</ColumnHeading>
                            {comingSoonLinks.map((label) => (
                                <ComingSoon key={label} label={label} />
                            ))}
                            <Link
                                href={login.url()}
                                className="text-[16px] leading-[22px] text-[#1e293b] underline decoration-[#1e293b]/40 underline-offset-2 hover:text-[#0f172a] focus-visible:rounded focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none dark:text-[#afc1dc] dark:decoration-[#afc1dc]/40 dark:hover:text-[#f4f6ff]"
                            >
                                Masuk dengan Google
                            </Link>
                        </div>
                        <div className="flex flex-1 flex-col gap-4">
                            <ColumnHeading>Zenuniverse</ColumnHeading>
                            <Link
                                href={home.url()}
                                className="text-[16px] leading-[22px] text-[#1e293b] underline decoration-[#1e293b]/40 underline-offset-2 hover:text-[#0f172a] focus-visible:rounded focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none dark:text-[#afc1dc] dark:decoration-[#afc1dc]/40 dark:hover:text-[#f4f6ff]"
                            >
                                Beranda
                            </Link>
                            <a
                                href="#tentang-kami"
                                className="text-[16px] leading-[22px] text-[#1e293b] underline decoration-[#1e293b]/40 underline-offset-2 hover:text-[#0f172a] focus-visible:rounded focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none dark:text-[#afc1dc] dark:decoration-[#afc1dc]/40 dark:hover:text-[#f4f6ff]"
                            >
                                Tentang kami
                            </a>
                        </div>
                        <div className="flex flex-1 flex-col gap-4">
                            <ColumnHeading>Untuk orang tua</ColumnHeading>
                            {parentLinks.map((label) => (
                                <ComingSoon key={label} label={label} />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-[#1e293b]/20 pt-5 text-[14px] text-[#1e293b] sm:flex-row sm:items-center sm:justify-between dark:border-[#334563] dark:text-[#afc1dc]">
                        <span>© 2026 Zenuniverse. Belajar asik, bersama.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
