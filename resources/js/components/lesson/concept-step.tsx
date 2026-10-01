import type { ConceptStep } from '@/types/lesson';

export function ConceptStepView({ step }: { step: ConceptStep }) {
    const { content } = step;

    return (
        <article className="lesson-player__concept">
            {content.eyebrow ? (
                <p className="lesson-player__concept-eyebrow">
                    {content.eyebrow}
                </p>
            ) : null}

            {content.title ? (
                <h1 className="lesson-player__concept-title">
                    {content.title}
                </h1>
            ) : null}

            {content.bodyHtml ? (
                <div
                    className="lesson-player__concept-body"
                    dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
                />
            ) : null}

            {content.illustration ? (
                <figure className="lesson-player__concept-figure">
                    <img
                        src={content.illustration.src}
                        alt={content.illustration.alt}
                        loading="lazy"
                    />
                    {content.illustration.caption ? (
                        <figcaption>{content.illustration.caption}</figcaption>
                    ) : null}
                </figure>
            ) : null}

            {content.code ? (
                <pre className="lesson-player__concept-code">
                    <code>{content.code}</code>
                </pre>
            ) : null}
        </article>
    );
}
