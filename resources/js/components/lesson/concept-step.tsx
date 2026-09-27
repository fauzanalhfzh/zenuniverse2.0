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
                <h2 className="lesson-player__concept-title">
                    {content.title}
                </h2>
            ) : null}

            {content.body ? (
                <p className="lesson-player__concept-body">{content.body}</p>
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
