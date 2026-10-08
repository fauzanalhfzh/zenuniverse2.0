import { PublicSeo } from '@/components/public-seo';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Pricing } from '@/components/landing/pricing';

export default function Price() {
    return (
        <>
            <PublicSeo />
            <Header />
            <main><Pricing /></main>
            <Footer />
        </>
    );
}
