import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { BlogCta, type BlogArticle } from '@/components/landing/blog-content';

export default function BlogArticlePage({ article }: { article: BlogArticle }) {
    return <><Head title={`${article.title} | Zenuniverse`} /><Header />
        <main className="bg-white text-[#1e293b]"><div className="mx-auto max-w-4xl px-5 py-12 sm:px-10">
            <Link href="/blog" className="inline-flex min-h-11 items-center font-bold text-[#b64d08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]">Kembali ke blog</Link>
            <article className="mt-6">
                <span className="rounded-full bg-[#fff4e5] px-3 py-2 text-sm font-semibold text-[#a4480c]">{article.category}</span>
                <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">{article.title}</h1>
                <p className="mt-5 text-lg leading-relaxed text-[#475569]">{article.excerpt}</p>

                <img src={article.image} alt="" className="mb-9 max-h-80 w-full rounded-2xl bg-[#fff4e5] object-contain p-5" />
                <div className="mt-8 space-y-5 text-lg leading-8 text-[#475569] [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:text-[#b64d08] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_img]:mx-auto [&_img]:block [&_img]:h-auto [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain" dangerouslySetInnerHTML={{ __html: article.body_html }} />
            </article>
            <BlogCta />
        </div></main><Footer showCta={false} />
    </>;
}
