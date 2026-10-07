import { Head } from '@inertiajs/react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Pricing } from '@/components/landing/pricing';

export default function Price() {
    return (
        <>
            <Head title="Harga paket | Zenuniverse" />
            <Header />
            <main><Pricing /></main>
            <Footer />
        </>
    );
}
