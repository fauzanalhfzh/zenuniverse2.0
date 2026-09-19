import { Button } from '@/components/ui/button';
import type { ConceptStep } from '@/types/lesson';

export function ConceptStepView({
    step,
    pending,
    onAcknowledge,
}: {
    step: ConceptStep;
    pending: boolean;
    onAcknowledge: () => void;
}) {
    const { content } = step;

    return (
        <div className="flex flex-col gap-6">
            {content.illustration ? (
                <img
                    src={content.illustration.src}
                    alt={content.illustration.alt}
                    loading="lazy"
                    className="mx-auto max-h-72 w-full rounded-2xl object-contain"
                />
            ) : null}

            {content.eyebrow ? (
                <p className="text-primary text-sm font-bold tracking-[2px] uppercase">
                    {content.eyebrow}
                </p>
            ) : null}

            {content.title ? (
                <h2 className="font-display text-3xl font-bold text-slate-900 max-sm:text-2xl">
                    {content.title}
                </h2>
            ) : null}

            {content.body ? (
                <p className="text-lg leading-relaxed whitespace-pre-line text-slate-600">
                    {content.body}
                </p>
            ) : null}

            {content.code ? (
                <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
                    <code>{content.code}</code>
                </pre>
            ) : null}

            <div>
                <Button onClick={onAcknowledge} disabled={pending}>
                    {pending ? 'Menyimpan...' : 'Saya paham, lanjut'}
                </Button>
            </div>
        </div>
    );
}
