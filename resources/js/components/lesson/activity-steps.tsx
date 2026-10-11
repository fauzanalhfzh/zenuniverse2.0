import { useRef, useState } from 'react';
import type { FlashcardStep, MatchingStep, UnjumbleStep } from '@/types/lesson';
import './activity-steps.css';

export function UnjumbleStepView({
    step,
    disabled,
    onSubmit,
}: {
    step: UnjumbleStep;
    disabled: boolean;
    onSubmit: (order: string[]) => void;
}) {
    const [order, setOrder] = useState<string[]>([]);
    const [announcement, setAnnouncement] = useState('');
    const refs = useRef<Record<string, HTMLButtonElement | null>>({});
    return (
        <div className="learning-activity">
            <p>{step.content.instructions}</p>
            <section
                aria-label="Susunan jawaban"
                className="learning-activity__slots"
            >
                {Array.from(
                    { length: step.content.tokens.length },
                    (_, index) => {
                        const id = order[index];
                        const token = step.content.tokens.find(
                            (token) => token.id === id,
                        );
                        return (
                            <button
                                type="button"
                                key={index}
                                className="learning-activity__token"
                                disabled={disabled || !token}
                                aria-label={
                                    token
                                        ? `Posisi ${index + 1}: ${token.label}. Kembalikan token`
                                        : `Posisi ${index + 1} kosong`
                                }
                                onClick={() => {
                                    setOrder((current) =>
                                        current.filter((item) => item !== id),
                                    );
                                    setAnnouncement(
                                        `${token?.label} dikembalikan ke pilihan.`,
                                    );
                                    refs.current[id]?.focus();
                                }}
                            >
                                {token?.label ?? `${index + 1}. …`}
                            </button>
                        );
                    },
                )}
            </section>
            <section
                aria-label="Pilihan token"
                className="learning-activity__tokens"
            >
                {step.content.tokens.map((token) => (
                    <button
                        type="button"
                        className="learning-activity__token"
                        key={token.id}
                        ref={(element) => {
                            refs.current[token.id] = element;
                        }}
                        aria-disabled={disabled || order.includes(token.id)}
                        onClick={() => {
                            if (disabled || order.includes(token.id)) return;
                            setOrder((current) => [...current, token.id]);
                            setAnnouncement(
                                `${token.label} masuk ke posisi ${order.length + 1}.`,
                            );
                        }}
                    >
                        {token.label}
                    </button>
                ))}
            </section>
            <span className="sr-only" role="status">
                {announcement}
            </span>
            <div className="learning-activity__actions">
                <span>
                    {order.length} dari {step.content.tokens.length} token
                    tersusun
                </span>
                <button
                    type="button"
                    className="lesson-player__code-fill-reset"
                    disabled={disabled || !order.length}
                    onClick={() => setOrder([])}
                >
                    Atur ulang
                </button>
                <button
                    type="button"
                    className="lesson-player__code-fill-submit"
                    disabled={
                        disabled || order.length !== step.content.tokens.length
                    }
                    onClick={() => onSubmit(order)}
                >
                    {disabled ? 'Memeriksa…' : 'Periksa urutan'}
                </button>
            </div>
        </div>
    );
}

export function MatchingStepView({
    step,
    disabled,
    onSubmit,
}: {
    step: MatchingStep;
    disabled: boolean;
    onSubmit: (pairs: Record<string, string>) => void;
}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [pairs, setPairs] = useState<Record<string, string>>({});
    const [announcement, setAnnouncement] = useState('');
    function remove(left: string) {
        setPairs((current) => {
            const next = { ...current };
            delete next[left];
            return next;
        });
        setSelected(left);
        setAnnouncement('Pasangan dilepas. Pilih jawaban pengganti.');
    }
    return (
        <div className="learning-activity">
            <p>
                {step.content.instructions} Klik pasangan yang sudah terhubung
                untuk melepasnya.
            </p>
            <div className="learning-activity__matching">
                <section
                    aria-label="Istilah"
                    className="learning-activity__column"
                >
                    <h2>Istilah</h2>
                    {step.content.left.map((item, index) => (
                        <button
                            type="button"
                            key={item.id}
                            className="learning-activity__match"
                            disabled={disabled}
                            aria-pressed={selected === item.id}
                            onClick={() => {
                                if (pairs[item.id]) remove(item.id);
                                else setSelected(item.id);
                            }}
                        >
                            <span className="learning-activity__pair-number">
                                {index + 1}
                            </span>
                            <span>
                                {item.label}
                                {pairs[item.id] ? (
                                    <small>
                                        Terhubung · klik untuk melepas
                                    </small>
                                ) : null}
                            </span>
                        </button>
                    ))}
                </section>
                <section
                    aria-label="Arti atau contoh"
                    className="learning-activity__column"
                >
                    <h2>Arti atau contoh</h2>
                    {step.content.right.map((item) => {
                        const left = Object.keys(pairs).find(
                            (key) => pairs[key] === item.id,
                        );
                        const number =
                            step.content.left.findIndex(
                                (item) => item.id === left,
                            ) + 1;
                        return (
                            <button
                                type="button"
                                key={item.id}
                                className="learning-activity__match"
                                aria-disabled={disabled || (!selected && !left)}
                                onClick={() => {
                                    if (disabled) return;
                                    if (left) {
                                        remove(left);
                                        return;
                                    }
                                    if (!selected) return;
                                    setPairs((current) => ({
                                        ...current,
                                        [selected]: item.id,
                                    }));
                                    setSelected(null);
                                    setAnnouncement(
                                        'Pasangan terhubung. Lanjutkan memasangkan istilah lain.',
                                    );
                                }}
                            >
                                {left ? (
                                    <span className="learning-activity__pair-number">
                                        {number}
                                    </span>
                                ) : null}
                                <span>
                                    {item.label}
                                    {left ? (
                                        <small>
                                            Terhubung dengan istilah {number}
                                        </small>
                                    ) : null}
                                </span>
                            </button>
                        );
                    })}
                </section>
            </div>
            <span role="status" className="sr-only">
                {announcement}
            </span>
            <div className="learning-activity__actions">
                <span>
                    {Object.keys(pairs).length} dari {step.content.left.length}{' '}
                    pasangan terhubung
                </span>
                <button
                    type="button"
                    className="lesson-player__code-fill-reset"
                    disabled={disabled || !Object.keys(pairs).length}
                    onClick={() => {
                        setPairs({});
                        setSelected(null);
                    }}
                >
                    Atur ulang
                </button>
                <button
                    type="button"
                    className="lesson-player__code-fill-submit"
                    disabled={
                        disabled ||
                        Object.keys(pairs).length !== step.content.left.length
                    }
                    onClick={() => onSubmit(pairs)}
                >
                    {disabled ? 'Memeriksa…' : 'Periksa pasangan'}
                </button>
            </div>
        </div>
    );
}

export function FlashcardStepView({
    step,
    disabled,
    onSubmit,
}: {
    step: FlashcardStep;
    disabled: boolean;
    onSubmit: (reviewedIds: string[]) => void;
}) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [reviewed, setReviewed] = useState<string[]>([]);
    const card = step.content.cards[index];
    if (!card) return <p>Kartu belum tersedia.</p>;
    function go(next: number) {
        setIndex(next);
        setFlipped(false);
    }
    return (
        <div className="learning-activity">
            <p>{step.content.instructions}</p>
            <p role="status">
                Kartu {index + 1} dari {step.content.cards.length} ·{' '}
                {reviewed.length} sudah diulas
            </p>
            <button
                type="button"
                className="learning-activity__flashcard"
                aria-label={
                    flipped ? 'Sembunyikan jawaban kartu' : 'Buka jawaban kartu'
                }
                aria-pressed={flipped}
                disabled={disabled}
                onClick={() => {
                    if (!flipped)
                        setReviewed((current) =>
                            current.includes(card.id)
                                ? current
                                : [...current, card.id],
                        );
                    setFlipped((current) => !current);
                }}
            >
                <span className="learning-activity__card-label">
                    {flipped ? 'Jawaban' : 'Ingat kembali'}
                </span>
                <span className="learning-activity__card-text">
                    {flipped ? card.back : card.front}
                </span>
                <span className="learning-activity__card-hint">
                    {flipped
                        ? 'Klik untuk kembali ke pertanyaan'
                        : 'Pikirkan jawabannya, lalu klik untuk membuka'}
                </span>
            </button>
            <div className="learning-activity__actions">
                <button
                    type="button"
                    className="lesson-player__code-fill-reset"
                    disabled={disabled || index === 0}
                    onClick={() => go(index - 1)}
                >
                    Kartu sebelumnya
                </button>
                <button
                    type="button"
                    className="lesson-player__code-fill-reset"
                    disabled={
                        disabled || index === step.content.cards.length - 1
                    }
                    onClick={() => go(index + 1)}
                >
                    Kartu berikutnya
                </button>
                <button
                    type="button"
                    className="lesson-player__code-fill-submit"
                    disabled={
                        disabled ||
                        reviewed.length !== step.content.cards.length
                    }
                    onClick={() => onSubmit(reviewed)}
                >
                    {disabled ? 'Menyimpan…' : 'Selesai mengulas'}
                </button>
            </div>
        </div>
    );
}
