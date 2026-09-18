import { Head } from '@inertiajs/react';
import { CTA } from '@/components/landing/cta';
import {
    CourseStrip,
    type CourseCatalogItem,
} from '@/components/landing/course-strip';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { MetodeBelajar } from '@/components/landing/metode-belajar';

interface HomeProps {
    courses: CourseCatalogItem[];
}

export default function Home({ courses }: HomeProps) {
    return (
        <>
            <Head title="ZenUniverse Academy" />
            <main className="flex flex-1 flex-col bg-white">
                <Header />
                <Hero />
                <CourseStrip courses={courses} />
                <MetodeBelajar />
                <CTA />
                <Footer />
            </main>
        </>
    );
}
