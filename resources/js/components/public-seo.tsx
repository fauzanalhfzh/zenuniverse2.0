import { Head, usePage } from '@inertiajs/react';

type SeoMetadata = { title: string; description: string; canonical: string; type: 'website' | 'article'; image: string; jsonLd: string };

export function PublicSeo() {
    const { seo } = usePage<{ seo: SeoMetadata }>().props;

    return (
        <Head title={seo.title}>
            <meta head-key="description" name="description" content={seo.description} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            <meta head-key="og:description" property="og:description" content={seo.description} />
            <meta head-key="og:url" property="og:url" content={seo.canonical} />
            <meta head-key="og:type" property="og:type" content={seo.type} />
            <meta head-key="og:image" property="og:image" content={seo.image} />
            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <script head-key="structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: seo.jsonLd }} />
        </Head>
    );
}
