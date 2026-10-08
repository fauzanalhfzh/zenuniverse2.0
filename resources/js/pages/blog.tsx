import { PublicSeo } from '@/components/public-seo';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { BlogContent, type BlogProps } from '@/components/landing/blog-content';

export default function Blog(props: BlogProps) {
    return <><PublicSeo /><Header /><BlogContent {...props} /><Footer showCta={false} /></>;
}
