import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CodeFillStep } from '@/types/lesson';

export function CodeFillStepView({
    step,
    pending,
    onSubmit,
}: {
    step: CodeFillStep;
    pending: boolean;
    onSubmit: (answers: Record<string, string>) => void;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});

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

            <div className="border-border flex flex-col gap-4 rounded-2xl border-2 bg-white p-4">
                {step.content.parts.map((part, index) => (
                    <div
                        key={`part-${index}`}
                        className="flex flex-wrap items-center gap-2"
                    >
                        {part ? (
                            <code className="font-mono text-sm text-slate-700">
                                {part}
                            </code>
                        ) : null}
                        {step.content.blanks
                            .filter(
                                (blank) => blank.id === `blank-${index + 1}`,
                            )
                            .map((blank) =>
                                blank.mode === 'choice' && blank.options ? (
                                    <select
                                        key={blank.id}
                                        value={answers[blank.id] ?? ''}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setAnswers((current) => ({
                                                ...current,
                                                [blank.id]: event.target.value,
                                            }))
                                        }
                                        className="border-border rounded-lg border-2 bg-white px-2 py-1.5 font-mono text-sm"
                                    >
                                        <option value="">Pilih…</option>
                                        {blank.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        key={blank.id}
                                        value={answers[blank.id] ?? ''}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setAnswers((current) => ({
                                                ...current,
                                                [blank.id]: event.target.value,
                                            }))
                                        }
                                        className="border-border w-32 rounded-lg border-2 bg-white px-2 py-1.5 font-mono text-sm"
                                    />
                                ),
                            )}
                    </div>
                ))}
            </div>

            <div>
                <Button onClick={() => onSubmit(answers)} disabled={pending}>
                    {pending ? 'Memeriksa...' : 'Periksa jawaban'}
                </Button>
            </div>
        </div>
    );
}
