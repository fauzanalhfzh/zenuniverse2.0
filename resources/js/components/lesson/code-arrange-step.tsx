import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CodeArrangeStep } from '@/types/lesson';

export function CodeArrangeStepView({
    step,
    pending,
    onSubmit,
}: {
    step: CodeArrangeStep;
    pending: boolean;
    onSubmit: (tokenIds: string[]) => void;
}) {
    const [ordered, setOrdered] = useState<string[]>([]);
    const chosen = new Set(ordered);

    return (
        <div className="flex flex-col gap-5">
            {step.content.title ? (
                <h2 className="font-display text-2xl font-bold text-slate-900">
                    {step.content.title}
                </h2>
            ) : null}
            {step.content.instructions ? (
                <p className="leading-relaxed text-slate-600">
                    {step.content.instructions}
                </p>
            ) : null}

            <div className="border-border bg-muted/40 min-h-24 rounded-2xl border-2 border-dashed p-3">
                {ordered.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Ketuk potongan di bawah untuk menyusun kode.
                    </p>
                ) : (
                    <ol className="flex flex-col gap-2">
                        {ordered.map((id, index) => {
                            const token = step.content.tokens.find(
                                (item) => item.id === id,
                            );

                            return (
                                <li
                                    key={id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <code className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-slate-100">
                                        {token?.text}
                                    </code>
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                                        onClick={() =>
                                            setOrdered((current) =>
                                                current.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        Hapus
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {step.content.tokens.map((token) => (
                    <button
                        key={token.id}
                        type="button"
                        disabled={chosen.has(token.id) || pending}
                        onClick={() =>
                            setOrdered((current) => [...current, token.id])
                        }
                        className={cn(
                            'border-border rounded-xl border-2 bg-white px-3 py-2 font-mono text-sm text-slate-700',
                            'hover:border-primary/60 focus-visible:ring-ring/50 focus-visible:ring-4 focus-visible:outline-none',
                            chosen.has(token.id) && 'opacity-40',
                        )}
                    >
                        {token.text}
                    </button>
                ))}
            </div>

            <div>
                <Button
                    onClick={() => onSubmit(ordered)}
                    disabled={pending || ordered.length === 0}
                >
                    {pending ? 'Memeriksa...' : 'Periksa susunan'}
                </Button>
            </div>
        </div>
    );
}
