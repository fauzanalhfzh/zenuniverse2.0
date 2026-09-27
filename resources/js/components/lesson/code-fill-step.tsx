import { useMemo, useRef, useState } from 'react';
import { Check, FileCode2, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CodeFillStep, FillBlank } from '@/types/lesson';

type CodeLine = {
    blankIds: string[];
    tokens: ReactNode[];
};

function buildCodeLines(
    step: CodeFillStep,
    renderBlank: (blank: FillBlank) => ReactNode,
) {
    const lines: CodeLine[] = [{ blankIds: [], tokens: [] }];

    step.content.parts.forEach((part, index) => {
        part.split('\n').forEach((line, lineIndex, splitLines) => {
            if (line) {
                lines[lines.length - 1].tokens.push(
                    <span key={`text-${index}-${lineIndex}`}>{line}</span>,
                );
            }

            if (lineIndex < splitLines.length - 1) {
                lines.push({ blankIds: [], tokens: [] });
            }
        });

        const blank = step.content.blanks[index];
        if (blank) {
            lines[lines.length - 1].blankIds.push(blank.id);
            lines[lines.length - 1].tokens.push(renderBlank(blank));
        }
    });

    return lines;
}

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
    const [focusedBlankId, setFocusedBlankId] = useState<string | null>(
        step.content.blanks[0]?.id ?? null,
    );
    const blankRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const filledCount = step.content.blanks.filter((blank) =>
        answers[blank.id]?.trim(),
    ).length;
    const lines = useMemo(
        () =>
            buildCodeLines(step, (blank) => (
                <input
                    key={blank.id}
                    ref={(element) => {
                        blankRefs.current[blank.id] = element;
                    }}
                    aria-label={`Isi ${blank.id}`}
                    autoFocus={blank.id === step.content.blanks[0]?.id}
                    className={`lesson-player__code-fill-input ${
                        focusedBlankId === blank.id
                            ? 'lesson-player__code-fill-input--active'
                            : ''
                    }`}
                    value={answers[blank.id] ?? ''}
                    disabled={pending}
                    placeholder="ketik jawaban"
                    autoComplete="off"
                    onFocus={() => setFocusedBlankId(blank.id)}
                    onBlur={() => setFocusedBlankId(null)}
                    onChange={(event) =>
                        setAnswers((current) => ({
                            ...current,
                            [blank.id]: event.target.value,
                        }))
                    }
                />
            )),
        [answers, focusedBlankId, pending, step],
    );

    function resetAnswers() {
        setAnswers({});
        const firstBlank = step.content.blanks[0];
        if (firstBlank) {
            blankRefs.current[firstBlank.id]?.focus();
        }
    }

    return (
        <div className="lesson-player__code-fill">
            <div className="lesson-player__code-fill-intro">
                <span className="lesson-player__code-fill-kicker">
                    Latihan ketik kode
                </span>
                {step.content.title ? (
                    <h2 className="lesson-player__code-fill-title">
                        {step.content.title}
                    </h2>
                ) : null}
                {step.content.instructions ? (
                    <p className="lesson-player__code-fill-instructions">
                        {step.content.instructions}
                    </p>
                ) : null}
            </div>

            <section
                className="lesson-player__code-fill-editor"
                aria-label="Editor pseudocode"
            >
                <div className="lesson-player__code-fill-filebar">
                    <span className="lesson-player__code-fill-file">
                        <FileCode2 size={16} aria-hidden="true" />
                        {step.content.language ?? 'pseudocode'}.pseudo
                    </span>
                    <span className="lesson-player__code-fill-count">
                        {step.content.blanks.length} bagian kosong
                    </span>
                </div>
                <div
                    className="lesson-player__code-fill-code"
                    role="region"
                    aria-label="Kode yang harus dilengkapi"
                    tabIndex={0}
                >
                    {lines.map((line, index) => (
                        <div
                            className={`lesson-player__code-fill-line ${
                                line.blankIds.includes(focusedBlankId ?? '')
                                    ? 'lesson-player__code-fill-line--active'
                                    : ''
                            }`}
                            key={`line-${index + 1}`}
                        >
                            <span
                                className="lesson-player__code-fill-number"
                                aria-hidden="true"
                            >
                                {index + 1}
                            </span>
                            <code>{line.tokens}</code>
                        </div>
                    ))}
                </div>
            </section>

            <section
                className="lesson-player__code-fill-guide"
                aria-label="Petunjuk mengisi kode"
            >
                <div>
                    <strong>Isi bagian kosong langsung di kode</strong>
                    <span>Ketik jawabanmu. Tidak ada token siap pilih.</span>
                </div>
                <p>
                    {step.content.hint ??
                        'Baca kode dari kiri ke kanan, lalu tulis bagian yang hilang.'}
                </p>
            </section>

            <div className="lesson-player__code-fill-actions">
                <span className="lesson-player__code-fill-progress">
                    <Check size={16} aria-hidden="true" />
                    {filledCount} dari {step.content.blanks.length} bagian
                    terisi
                </span>
                <div>
                    <button
                        type="button"
                        className="lesson-player__code-fill-reset"
                        onClick={resetAnswers}
                        disabled={pending || filledCount === 0}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                        Atur ulang
                    </button>
                    <button
                        type="button"
                        className="lesson-player__code-fill-submit"
                        onClick={() => onSubmit(answers)}
                        disabled={pending}
                    >
                        <span>
                            {pending ? 'Memeriksa...' : 'Periksa jawaban'}
                        </span>
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
