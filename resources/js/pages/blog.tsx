import { Head } from '@inertiajs/react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { BlogContent, type BlogProps } from '@/components/landing/blog-content';

export default function Blog(props: BlogProps) {
    return <><Head title="Cerita dari Bumi Zen | Zenuniverse" /><Header /><BlogContent {...props} /><Footer showCta={false} /></>;
}
