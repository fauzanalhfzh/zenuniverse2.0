import { Link } from '@inertiajs/react';
import { Camera, Music2, Play } from 'lucide-react';
import { home, login } from '@/routes';
import { CTA } from './cta';

const comingSoonLinks = ['Alur belajar', 'Mulai misi pertama'] as const;
const parentLinks = ['Panduan pendampingan', 'Kenali cara belajarnya'] as const;
const socials = [
    { label: 'Instagram', Icon: Camera },
    { label: 'YouTube', Icon: Play },
    { label: 'TikTok', Icon: Music2 },
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
                                {socials.map(({ label, Icon }) => (
                                    <Icon
                                        key={label}
                                        className="size-[22px]"
                                        aria-label={label}
                                    />
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
