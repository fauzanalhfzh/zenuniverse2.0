import { Dialog } from '@base-ui/react/dialog';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Check,
    Code2,
    HelpCircle,
    ListTree,
    LockKeyhole,
    X,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { CodeFillStepView } from '@/components/lesson/code-fill-step';
import { ConceptStepView } from '@/components/lesson/concept-step';
import { LessonCompletion } from '@/components/lesson/lesson-completion';
import { QuizStepView } from '@/components/lesson/quiz-step';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/progress/client';
import { useProgressSession } from '@/lib/progress/session';
import { dashboard } from '@/routes';
import { createLessonStore } from '@/stores/lesson-store';
import type { LessonPayload, LessonStep, StepAnswer } from '@/types/lesson';

const BlocklyStepView = lazy(() =>
    import('@/components/lesson/blockly-step').then((module) => ({
        default: module.BlocklyStepView,
    })),
);
const CodeEditorStepView = lazy(() =>
    import('@/components/lesson/code-editor-step').then((module) => ({
        default: module.CodeEditorStepView,
    })),
);

export function LessonPlayer({ lesson }: { lesson: LessonPayload }) {
    const store = useMemo(() => createLessonStore(), []);
    const state = useStore(store);
    const { submit, completeLesson, progress } = useProgressSession();
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [resultStepId, setResultStepId] = useState<string | null>(null);
    const outlineToggleRef = useRef<HTMLButtonElement>(null);
    const continueRef = useRef<HTMLButtonElement>(null);
    const answerTriggerRef = useRef<HTMLElement | null>(null);

    function playSound(name: 'correct' | 'incorrect' | 'finish') {
        void new Audio(`/sounds/${name}.mp3`).play().catch(() => {});
    }

    useEffect(() => {
        if (!outlineOpen) {
            return;
        }

        function closeOutline(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOutlineOpen(false);
                outlineToggleRef.current?.focus();
            }
        }

        document.addEventListener('keydown', closeOutline);

        return () => document.removeEventListener('keydown', closeOutline);
    }, [outlineOpen]);

    const total = lesson.steps.length;
    const step = lesson.steps[state.stepIndex];
    const resultOutcome = resultStepId
        ? state.outcomes[resultStepId]
        : undefined;
    const completedSteps = new Set(lesson.completedStepIds);

    for (const [stepId, stepOutcome] of Object.entries(state.outcomes)) {
        if (stepOutcome.correct) {
            completedSteps.add(stepId);
        }
    }

    async function answer(payload: StepAnswer, stepToAnswer = step) {
        if (!stepToAnswer || store.getState().pending) {
            return false;
        }

        setError(null);
        store.getState().setPending(true);

        try {
            const result = await submit({
                lesson_id: lesson.id,
                step_id: stepToAnswer.id,
                attempt_id: crypto.randomUUID(),
                content_revision: lesson.contentRevision,
                answer: payload,
            });

            store.getState().recordOutcome(stepToAnswer.id, {
                correct: result.result.correct,
                feedback: result.result.feedback,
                consumeHeart: result.result.consumeHeart,
                xpAwarded: result.xpAwarded,
            });

            if (stepToAnswer.type !== 'concept') {
                setResultStepId(stepToAnswer.id);
                playSound(result.result.correct ? 'correct' : 'incorrect');
            }

            return result.result.correct;
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? caught.message
                    : 'Koneksi bermasalah. Coba lagi.',
            );

            return false;
        } finally {
            store.getState().setPending(false);
        }
    }

    async function handleContinue() {
        const currentStep = lesson.steps[store.getState().stepIndex];

        if (!currentStep) {
            return;
        }

        const currentOutcome = store.getState().outcomes[currentStep.id];
        const alreadyCompleted = lesson.completedStepIds.includes(
            currentStep.id,
        );

        if (
            currentStep.type === 'concept' &&
            !currentOutcome?.correct &&
            !alreadyCompleted
        ) {
            const correct = await answer(
                { type: 'concept', acknowledged: true },
                currentStep,
            );

            if (!correct) {
                return;
            }
        }

        const allCorrect = lesson.steps.every(
            (item) =>
                store.getState().outcomes[item.id]?.correct ||
                lesson.completedStepIds.includes(item.id),
        );
        const currentIndex = store.getState().stepIndex;

        if (currentIndex < total - 1) {
            store.getState().next(total);
            return;
        }

        if (!allCorrect) {
            setError(
                'Selesaikan semua langkah dulu sebelum menutup pelajaran.',
            );
            return;
        }

        store.getState().setPending(true);

        try {
            await completeLesson(lesson.id, lesson.contentRevision);
            store.getState().setCompleted(true);
            playSound('finish');
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? caught.message
                    : 'Gagal menyimpan penyelesaian. Coba lagi.',
            );
        } finally {
            store.getState().setPending(false);
        }
    }

    if (state.completed) {
        return (
            <div className="lesson-player lesson-player--completed">
                <div className="lesson-player__completion">
                    <LessonCompletion
                        xpEarned={state.xpEarned}
                        lessonTitle={lesson.title}
                        courseId={lesson.courseId}
                    />
                </div>
            </div>
        );
    }

    const currentStepNumber =
        total === 0 ? 0 : Math.min(state.stepIndex + 1, total);
    const progressPercent = total === 0 ? 0 : (currentStepNumber / total) * 100;
    const stepDone = step ? completedSteps.has(step.id) : false;
    const canContinue =
        Boolean(step) &&
        !state.pending &&
        (step?.type === 'concept' || stepDone);
    const nextLabel =
        state.stepIndex < total - 1
            ? nextStepLabel(lesson.steps[state.stepIndex + 1])
            : 'Selesaikan pelajaran';
    const previousConceptIndex = lesson.steps.findLastIndex(
        (item, index) => index < state.stepIndex && item.type === 'concept',
    );

    return (
        <div className="lesson-player">
            <header className="lesson-player__header">
                <div className="lesson-player__header-inner">
                    <div className="lesson-player__brand">
                        <Link
                            href={dashboard.url({
                                query: { course: lesson.courseId },
                            })}
                            aria-label={`Kembali ke ${lesson.courseTitle}`}
                            className="lesson-player__close"
                        >
                            <X aria-hidden="true" size={20} />
                        </Link>
                        <div className="lesson-player__identity">
                            <span>{lesson.courseTitle}</span>
                            <strong>{lesson.title}</strong>
                        </div>
                    </div>

                    <div
                        className="lesson-player__header-progress"
                        role="progressbar"
                        aria-label="Kemajuan pelajaran"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progressPercent)}
                    >
                        <div
                            className="lesson-player__header-progress-value"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="lesson-player__stats">
                        <button
                            ref={outlineToggleRef}
                            type="button"
                            className="lesson-player__outline-toggle"
                            aria-controls="lesson-step-outline"
                            aria-expanded={outlineOpen}
                            aria-label={
                                outlineOpen
                                    ? 'Tutup alur pelajaran'
                                    : `Buka alur pelajaran, materi ${currentStepNumber} dari ${total}`
                            }
                            onClick={() => setOutlineOpen((open) => !open)}
                        >
                            <ListTree aria-hidden="true" size={17} />
                            <span>
                                Materi {currentStepNumber} / {total}
                            </span>
                        </button>
                        <span
                            data-testid="player-xp"
                            className="lesson-player__xp"
                        >
                            XP {progress?.totalXp ?? '-'}
                        </span>
                        <span className="lesson-player__stats-divider" />
                        <span
                            className="lesson-player__hearts"
                            data-testid="player-hearts"
                            aria-label={`Hati tersisa: ${progress?.hearts ?? 'Belum tersedia'}`}
                        >
                            {progress ? (
                                Array.from({ length: progress.hearts }).map(
                                    (_, index) => (
                                        <img
                                            key={index}
                                            src="/images/stats/heart.png"
                                            alt=""
                                            className="lesson-player__heart-icon"
                                        />
                                    ),
                                )
                            ) : (
                                <span className="lesson-player__hearts-empty">
                                    -
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </header>

            <div className="lesson-player__body">
                <aside
                    id="lesson-step-outline"
                    className={`lesson-player__rail lesson-player__rail--left ${
                        outlineOpen ? 'lesson-player__rail--open' : ''
                    }`}
                    aria-label="Alur pelajaran"
                    aria-hidden={!outlineOpen}
                    {...(!outlineOpen ? { inert: true } : {})}
                >
                    <div className="lesson-player__rail-header">
                        <p className="lesson-player__rail-label">
                            Alur pelajaran
                        </p>
                        <h2 className="lesson-player__rail-heading">
                            Dari konsep ke praktik
                        </h2>
                        <p className="lesson-player__rail-progress">
                            {currentStepNumber} dari {total} langkah
                        </p>
                    </div>

                    <nav className="lesson-player__steps">
                        {lesson.steps.map((item, index) => {
                            const isCurrent = index === state.stepIndex;
                            const isComplete = completedSteps.has(item.id);
                            const isLocked =
                                index > state.stepIndex && !isComplete;
                            const StepIcon = stepIcon(item);

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={isLocked}
                                    aria-current={
                                        isCurrent ? 'step' : undefined
                                    }
                                    onClick={() => {
                                        store.getState().goTo(index);
                                        setOutlineOpen(false);
                                        outlineToggleRef.current?.focus();
                                    }}
                                    className={`lesson-player__step-link ${
                                        isCurrent
                                            ? 'lesson-player__step-link--current'
                                            : ''
                                    }`}
                                >
                                    <span className="lesson-player__rail-icon">
                                        {isComplete ? (
                                            <Check
                                                aria-hidden="true"
                                                size={17}
                                            />
                                        ) : isLocked ? (
                                            <LockKeyhole
                                                aria-hidden="true"
                                                size={15}
                                            />
                                        ) : (
                                            <StepIcon
                                                aria-hidden="true"
                                                size={17}
                                            />
                                        )}
                                    </span>
                                    <span className="lesson-player__step-copy">
                                        <strong>{stepLabel(item)}</strong>
                                        <small>
                                            {isComplete
                                                ? 'Selesai'
                                                : isLocked
                                                  ? 'Terkunci'
                                                  : stepTypeLabel(item)}
                                        </small>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="lesson-player__main">
                    {step?.type === 'blockly' || step?.type === 'code' ? (
                        <h1 className="sr-only">{stepLabel(step)}</h1>
                    ) : (
                        <div className="lesson-player__main-heading">
                            <div className="lesson-player__context">
                                <span>
                                    <BookOpen aria-hidden="true" size={16} />
                                    {step
                                        ? stepTypeLabel(step)
                                        : 'Materi pelajaran'}
                                </span>
                                <span
                                    className={`lesson-player__status ${
                                        stepDone
                                            ? 'lesson-player__status--done'
                                            : ''
                                    }`}
                                >
                                    {stepDone ? 'Selesai' : 'Belum selesai'}
                                </span>
                            </div>
                            {step?.type !== 'concept' ? (
                                <>
                                    <h1 className="lesson-player__heading">
                                        {step ? stepLabel(step) : lesson.title}
                                    </h1>
                                    <p className="lesson-player__description">
                                        {lesson.description}
                                    </p>
                                </>
                            ) : null}
                        </div>
                    )}

                    {error ? (
                        <div role="alert" className="lesson-player__error">
                            {error}
                        </div>
                    ) : null}

                    {step ? (
                        <div
                            className={`lesson-player__step-card ${
                                step.type === 'concept'
                                    ? 'lesson-player__step-card--concept'
                                    : ''
                            }`}
                        >
                            <StepView
                                key={step.id}
                                step={step}
                                pending={state.pending}
                                selected={selected[step.id]}
                                onAnswer={(payload) => {
                                    answerTriggerRef.current =
                                        document.activeElement instanceof
                                        HTMLElement
                                            ? document.activeElement
                                            : null;
                                    void answer(payload, step);
                                }}
                                onSelect={(optionId) => {
                                    answerTriggerRef.current =
                                        document.activeElement instanceof
                                        HTMLElement
                                            ? document.activeElement
                                            : null;
                                    setSelected((current) => ({
                                        ...current,
                                        [step.id]: optionId,
                                    }));
                                    void answer(
                                        { type: 'quiz', optionId },
                                        step,
                                    );
                                }}
                            />
                        </div>
                    ) : (
                        <div className="lesson-player__empty" role="status">
                            <p className="lesson-player__empty-label">
                                Materi belum tersedia
                            </p>
                            <h2 className="lesson-player__empty-heading">
                                Pelajaran ini belum memiliki langkah.
                            </h2>
                            <p>
                                Kembali ke dashboard untuk memilih pelajaran
                                lain.
                            </p>
                            <Button
                                href={dashboard.url({
                                    query: { course: lesson.courseId },
                                })}
                            >
                                Kembali ke kursus
                            </Button>
                        </div>
                    )}
                </main>
            </div>

            <footer className="lesson-player__footer">
                <div className="lesson-player__footer-inner">
                    <div className="lesson-player__footer-actions">
                        <Button
                            variant="primary"
                            className="lesson-player__continue"
                            data-testid="player-continue-button"
                            ref={continueRef}
                            disabled={!canContinue}
                            onClick={() => void handleContinue()}
                        >
                            {state.pending ? 'Menyimpan…' : nextLabel}
                        </Button>
                    </div>
                </div>
            </footer>

            <Dialog.Root
                open={Boolean(resultOutcome)}
                onOpenChange={(open) => !open && setResultStepId(null)}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="lesson-result__backdrop" />
                    <Dialog.Popup
                        className="lesson-result__popup"
                        initialFocus={() =>
                            document.querySelector<HTMLElement>(
                                '.lesson-result__action',
                            )
                        }
                        finalFocus={() =>
                            answerTriggerRef.current?.isConnected
                                ? answerTriggerRef.current
                                : continueRef.current
                        }
                    >
                        <Dialog.Close
                            className="lesson-result__close"
                            aria-label="Tutup hasil jawaban"
                        >
                            <X size={17} aria-hidden="true" />
                        </Dialog.Close>
                        <Dialog.Title className="lesson-result__title">
                            {resultOutcome?.correct
                                ? 'Jawabanmu benar!'
                                : 'Belum tepat, coba lagi'}
                        </Dialog.Title>
                        <Dialog.Description className="lesson-result__description">
                            {resultOutcome?.feedback}
                        </Dialog.Description>
                        <div className="lesson-result__actions">
                            {resultOutcome?.correct ? (
                                <button
                                    type="button"
                                    className="lesson-result__action lesson-result__action--correct"
                                    onClick={() => {
                                        setResultStepId(null);
                                        void handleContinue();
                                    }}
                                >
                                    {state.stepIndex < total - 1
                                        ? 'Lanjut ke materi berikutnya'
                                        : 'Selesaikan pelajaran'}
                                </button>
                            ) : (
                                <>
                                    <Dialog.Close className="lesson-result__action lesson-result__action--wrong">
                                        Coba lagi
                                    </Dialog.Close>
                                    {previousConceptIndex >= 0 ? (
                                        <button
                                            type="button"
                                            className="lesson-result__action lesson-result__action--review"
                                            onClick={() => {
                                                store
                                                    .getState()
                                                    .goTo(previousConceptIndex);
                                                setResultStepId(null);
                                            }}
                                        >
                                            Baca ulang materi
                                        </button>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

function stepLabel(step: LessonStep): string {
    switch (step.type) {
        case 'concept':
            return step.content.title ?? 'Pengenalan';
        case 'quiz':
            return step.content.question ?? 'Cek pemahaman';
        case 'blockly':
            return step.content.title ?? 'Susun algoritma';
        case 'code-fill':
            return step.content.title ?? 'Lengkapi kode';
        case 'code':
            return step.content.title ?? 'Tulis program';
    }
}

function stepTypeLabel(step: LessonStep): string {
    switch (step.type) {
        case 'concept':
            return 'Materi';
        case 'quiz':
            return 'Kuis';
        case 'blockly':
            return 'Susun blok';
        case 'code-fill':
            return 'Lengkapi kode';
        case 'code':
            return 'Tulis kode';
    }
}

function stepIcon(step: LessonStep) {
    switch (step.type) {
        case 'concept':
            return BookOpen;
        case 'quiz':
            return HelpCircle;
        case 'blockly':
        case 'code-fill':
        case 'code':
            return Code2;
    }
}

function nextStepLabel(step?: LessonStep): string {
    if (!step) {
        return 'Lanjut ke langkah berikutnya';
    }

    switch (step.type) {
        case 'concept':
            return 'Lanjut ke materi berikutnya';
        case 'quiz':
            return 'Lanjut ke cek pemahaman';
        case 'blockly':
        case 'code-fill':
        case 'code':
            return 'Lanjut ke latihan';
    }
}

function StepView({
    step,
    pending,
    selected,
    onAnswer,
    onSelect,
}: {
    step: LessonStep;
    pending: boolean;
    selected?: string;
    onAnswer: (answer: StepAnswer) => void;
    onSelect: (optionId: string) => void;
}) {
    switch (step.type) {
        case 'concept':
            return <ConceptStepView step={step} />;
        case 'quiz':
            return (
                <QuizStepView
                    step={step}
                    selectedId={selected}
                    disabled={pending}
                    onSelect={onSelect}
                />
            );
        case 'code-fill':
            return (
                <CodeFillStepView
                    step={step}
                    pending={pending}
                    onSubmit={(answers) =>
                        onAnswer({ type: 'code-fill', answers })
                    }
                />
            );
        case 'blockly':
            return (
                <Suspense fallback={<StepLoading />}>
                    <BlocklyStepView
                        step={step}
                        pending={pending}
                        onSubmit={(commands) =>
                            onAnswer({ type: 'blockly', commands })
                        }
                    />
                </Suspense>
            );
        case 'code':
            return (
                <Suspense fallback={<StepLoading />}>
                    <CodeEditorStepView
                        step={step}
                        pending={pending}
                        onSubmit={(code) => onAnswer({ type: 'code', code })}
                    />
                </Suspense>
            );
    }
}

function StepLoading() {
    return (
        <p className="py-10 text-center text-sm font-bold text-slate-500">
            Memuat langkah…
        </p>
    );
}
