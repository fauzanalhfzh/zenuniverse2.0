import { useRef, useState } from 'react';
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

type CodeFillProps = {
    step: CodeFillStep;
    pending: boolean;
    onSubmit: (answers: Record<string, string>) => void;
};

export function CodeFillStepView(props: CodeFillProps) {
    return <CodeFillExercise key={props.step.id} {...props} />;
}

function CodeFillExercise({ step, pending, onSubmit }: CodeFillProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [selectedTokens, setSelectedTokens] = useState<
        Record<string, string>
    >({});
    const [announcement, setAnnouncement] = useState('');
    const [focusedBlankId, setFocusedBlankId] = useState<string | null>(
        step.content.blanks[0]?.id ?? null,
    );
    const blankRefs = useRef<
        Record<string, HTMLInputElement | HTMLButtonElement | null>
    >({});
    const tokenRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const choiceBlanks = step.content.blanks.filter(
        (blank) => blank.mode === 'choice',
    );
    const tokens = choiceBlanks.flatMap((blank) =>
        (blank.options ?? []).map((value, index) => ({
            id: `${blank.id}-${index}`,
            value,
        })),
    );
    const hasChoices = choiceBlanks.length > 0;
    const hasText = step.content.blanks.some((blank) => blank.mode === 'text');
    const availableBlank =
        choiceBlanks.find(
            (blank) => blank.id === focusedBlankId && !answers[blank.id],
        ) ?? choiceBlanks.find((blank) => !answers[blank.id]);
    const filledCount = step.content.blanks.filter((blank) =>
        answers[blank.id]?.trim(),
    ).length;
    const lines = buildCodeLines(step, (blank) => {
        const index = step.content.blanks.findIndex(
            (item) => item.id === blank.id,
        );
        const className = `lesson-player__code-fill-input ${focusedBlankId === blank.id ? 'lesson-player__code-fill-input--active' : ''}`;
        if (blank.mode === 'choice') {
            return (
                <button
                    key={blank.id}
                    type="button"
                    ref={(element) => {
                        blankRefs.current[blank.id] = element;
                    }}
                    className={`${className} lesson-player__code-fill-slot ${answers[blank.id] ? 'lesson-player__code-fill-slot--filled' : ''}`}
                    aria-label={
                        answers[blank.id]
                            ? `Bagian ${index + 1}: ${answers[blank.id]}. Klik untuk mengembalikan pilihan`
                            : `Pilih bagian kosong ${index + 1}`
                    }
                    aria-pressed={focusedBlankId === blank.id}
                    disabled={pending}
                    onFocus={() => setFocusedBlankId(blank.id)}
                    onClick={() => {
                        const tokenId = selectedTokens[blank.id];
                        setFocusedBlankId(blank.id);
                        if (!tokenId) return;
                        setAnswers((current) => ({
                            ...current,
                            [blank.id]: '',
                        }));
                        setSelectedTokens((current) => {
                            const next = { ...current };
                            delete next[blank.id];
                            return next;
                        });
                        setAnnouncement(
                            `Pilihan ${answers[blank.id]} dikembalikan. Bagian ${index + 1} kosong.`,
                        );
                        tokenRefs.current[tokenId]?.focus();
                    }}
                >
                    {answers[blank.id] || '...'}
                </button>
            );
        }
        return (
            <input
                key={blank.id}
                ref={(element) => {
                    blankRefs.current[blank.id] = element;
                }}
                aria-label={`Isi bagian kosong ${index + 1}`}
                autoFocus={blank.id === step.content.blanks[0]?.id}
                className={className}
                value={answers[blank.id] ?? ''}
                style={{
                    width: `${Math.max(2, (answers[blank.id] ?? '').length) + 2}ch`,
                }}
                disabled={pending}
                placeholder="..."
                autoComplete="off"
                onFocus={() => setFocusedBlankId(blank.id)}
                onChange={(event) =>
                    setAnswers((current) => ({
                        ...current,
                        [blank.id]: event.target.value,
                    }))
                }
            />
        );
    });

    function resetAnswers() {
        setAnswers({});
        setSelectedTokens({});
        setAnnouncement('Semua bagian dikosongkan. Pilihan tersedia kembali.');
        const firstBlank = step.content.blanks[0];
        if (firstBlank) {
            setFocusedBlankId(firstBlank.id);
            blankRefs.current[firstBlank.id]?.focus();
        }
    }

    return (
        <div className="lesson-player__code-fill">
            <div className="lesson-player__code-fill-intro">
                <span className="lesson-player__code-fill-kicker">
                    {hasChoices
                        ? 'Latihan lengkapi kode'
                        : 'Latihan ketik kode'}
                </span>
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

            {hasChoices ? (
                <section
                    className="lesson-player__code-fill-bank"
                    aria-label="Pilihan jawaban"
                >
                    <strong>Pilih jawaban</strong>
                    <p>
                        Klik pilihan untuk mengisi kotak kosong. Klik jawaban di
                        kode untuk mengembalikannya.
                        {hasText
                            ? ' Ketik jawaban pada bagian yang tidak memiliki pilihan.'
                            : ''}
                    </p>
                    <div className="lesson-player__code-fill-options">
                        {tokens.map((token) => {
                            const used = Object.values(selectedTokens).includes(
                                token.id,
                            );
                            return (
                                <button
                                    key={token.id}
                                    type="button"
                                    className="lesson-player__code-fill-token"
                                    ref={(element) => {
                                        tokenRefs.current[token.id] = element;
                                    }}
                                    aria-label={
                                        used
                                            ? `${token.value} sudah dipakai`
                                            : `Pilih ${token.value}`
                                    }
                                    aria-disabled={
                                        pending || used || !availableBlank
                                    }
                                    onClick={() => {
                                        if (pending || used || !availableBlank)
                                            return;
                                        setAnswers((current) => ({
                                            ...current,
                                            [availableBlank.id]: token.value,
                                        }));
                                        setSelectedTokens((current) => ({
                                            ...current,
                                            [availableBlank.id]: token.id,
                                        }));
                                        const next = choiceBlanks.find(
                                            (blank) =>
                                                blank.id !==
                                                    availableBlank.id &&
                                                !answers[blank.id],
                                        );
                                        setFocusedBlankId(
                                            next?.id ?? availableBlank.id,
                                        );
                                        const index =
                                            step.content.blanks.findIndex(
                                                (blank) =>
                                                    blank.id ===
                                                    availableBlank.id,
                                            );
                                        setAnnouncement(
                                            `${token.value} masuk ke bagian ${index + 1}.`,
                                        );
                                    }}
                                >
                                    {token.value}
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}
            <span className="sr-only" role="status">
                {announcement}
            </span>

            <section
                className="lesson-player__code-fill-guide"
                aria-label="Petunjuk mengisi kode"
            >
                <div>
                    <strong>
                        {hasChoices
                            ? 'Lengkapi kode dari kiri ke kanan'
                            : 'Isi bagian kosong langsung di kode'}
                    </strong>
                    <span>
                        {hasChoices
                            ? 'Pilih kotak kosong untuk menentukan bagian yang ingin diisi.'
                            : 'Ketik jawabanmu pada kotak kosong.'}
                    </span>
                </div>
                <p>
                    {step.content.hint ??
                        'Perhatikan susunan kode sebelum memeriksa jawaban.'}
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
                        disabled={
                            pending ||
                            filledCount !== step.content.blanks.length
                        }
                    >
                        <span>
                            {pending ? 'Memeriksa...' : 'Periksa jawaban'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
