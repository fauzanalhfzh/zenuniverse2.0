import { Link } from '@inertiajs/react';

import { PrimaryCtaLink, primaryCtaClassName } from './primary-cta';

export interface BlogArticle {
    slug: string; title: string; category: string; image: string; excerpt: string; status: string;
    body_html: string; is_featured: boolean;
}
export interface BlogProps { articles: BlogArticle[]; category?: string; pagination?: { previous: string | null; next: string | null } }
const categories = ['Semua', 'Coding untuk anak', 'Orang tua', 'Tips belajar', 'Logika', 'Cerita komunitas'];
const articleLinkClass = 'inline-flex min-h-11 items-center gap-2 font-bold text-[#b64d08] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]';

function ArticleImage({ article, featured = false }: { article: BlogArticle; featured?: boolean }) {
    const illustration = article.image.endsWith('.svg');
    return <div className={`overflow-hidden rounded-[20px] bg-[#fff4e5] ${featured ? 'aspect-[4/3] sm:aspect-[3/2]' : 'aspect-[16/9]'}`}>
        <img src={article.image} alt="" loading={featured ? 'eager' : 'lazy'} className={`h-full w-full object-contain ${illustration ? '' : 'p-7'}`} />
    </div>;
}

export function BlogCta() {
    return <section aria-labelledby="blog-cta-title" className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-[#fff4e5] p-7 sm:flex-row sm:items-center sm:p-10">
        <div><h2 id="blog-cta-title" className="font-display text-2xl font-semibold sm:text-3xl">Sudah siap ikut petualangannya?</h2><p className="mt-2 max-w-xl text-[#475569]">Pilih jalur belajarmu dan coba misi pertama di Zenuniverse.</p></div>
        <PrimaryCtaLink className="shrink-0" />
    </section>;
}

export function BlogContent({ articles, category = 'Semua', pagination }: BlogProps) {
    const featured = category === 'Semua' ? articles[0] : undefined;
    const others = category === 'Semua' ? articles.slice(1) : articles.filter(article => article.category === category);
    return <main className="bg-white text-[#1e293b]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-10 sm:pt-20">
            <section aria-labelledby="blog-title" className="text-center">
                <span className="inline-block rounded-full bg-[#fff4e5] px-4 py-2 text-xs font-bold tracking-[0.14em] text-[#a4480c]">BLOG ZENUNIVERSE</span>
                <h1 id="blog-title" className="mt-5 font-display text-4xl font-semibold sm:text-5xl">Cerita dari Bumi Zen</h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-[#475569]">Ide, tips, dan cerita tentang belajar coding untuk anak dan orang tua.</p>

            </section>
            <div role="group" aria-label="Filter kategori artikel" className="mb-12 mt-8 flex flex-wrap justify-center gap-2">
                {categories.map(item => <Link key={item} href={item === 'Semua' ? '/blog' : `/blog?category=${encodeURIComponent(item)}`} aria-current={category === item ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#4338ca] ${category === item ? 'bg-[#ff8a3d] text-[#422006]' : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#fff4e5]'}`}>{item}</Link>)}
            </div>
            {featured && <section aria-label="Artikel pilihan" className="mb-14 grid items-center gap-7 md:grid-cols-2 md:gap-10">
                <ArticleImage article={featured} featured />
                <div><span className="inline-block rounded-full bg-[#e6f5ed] px-3 py-1.5 text-xs font-bold text-[#276348]">{featured.category} · {featured.is_featured ? 'PILIHAN' : 'TERBARU'}</span>
                    <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{featured.title}</h2>
                    <p className="mt-4 leading-relaxed text-[#475569]">{featured.excerpt}</p>
                    <Link className={`${primaryCtaClassName} mt-6 gap-2`} href={`/blog/${featured.slug}`}>Baca artikel</Link>
                </div>
            </section>}
            <section aria-labelledby="other-articles-title">
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2"><h2 id="other-articles-title" className="font-display text-2xl font-semibold">{category === 'Semua' ? 'Artikel lainnya' : category}</h2><p aria-live="polite" className="text-sm text-[#64748b]">{others.length} artikel · bacaan kecil, ide baru</p></div>
                {others.length === 0 && <p role="status" className="rounded-2xl bg-[#f8fafc] p-6 text-[#475569]">{featured ? 'Belum ada artikel lainnya.' : category === 'Semua' ? 'Belum ada artikel terbit. Nantikan cerita terbaru dari Bumi Zen.' : 'Belum ada artikel terbit dalam kategori ini.'}</p>}
                <div data-blog-grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {others.map(article => <article data-blog-card key={article.slug} className="flex flex-col overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white">
                        <ArticleImage article={article} />
                        <div className="flex flex-1 flex-col p-5"><span className="self-start rounded-full bg-[#fff4e5] px-3 py-1 text-xs font-semibold text-[#a4480c]">{article.category}</span>
                            <h3 className="mt-3 font-display text-[23px] leading-tight font-semibold">{article.title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-[#475569]">{article.excerpt}</p>
                            <Link href={`/blog/${article.slug}`} className={`${articleLinkClass} mt-auto pt-3`}>Baca artikel</Link>
                        </div>
                    </article>)}
                </div>
            </section>
            {(pagination?.previous || pagination?.next) && <nav aria-label="Halaman artikel" className="mt-8 flex justify-between gap-4">{pagination.previous && <Link className={articleLinkClass} href={pagination.previous}>Sebelumnya</Link>}{pagination.next && <Link className={`${articleLinkClass} ml-auto`} href={pagination.next}>Berikutnya</Link>}</nav>}
            <BlogCta />
        </div>
    </main>;
}
