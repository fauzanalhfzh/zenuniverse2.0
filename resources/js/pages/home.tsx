import { Head } from '@inertiajs/react';
import { About } from '@/components/landing/about';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { LanguageStrip } from '@/components/landing/language-strip';

export default function Home() {
    return (
        <>
            <Head title="ZenUniverse Academy" />
            <a
                href="#konten"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-[14px] focus:bg-[#ff8a3d] focus:px-4 focus:py-3 focus:text-[15px] focus:font-bold focus:text-[#0f172a]"
            >
                Lewati ke konten utama
            </a>
            <Header />
            <main id="konten" className="bg-white dark:bg-[#0b1429]">
                <Hero />
                <LanguageStrip />
                <About />
            </main>
            <Footer />
        </>
    );
}
