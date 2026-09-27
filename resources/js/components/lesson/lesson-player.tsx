import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    Code2,
    HelpCircle,
    LockKeyhole,
    PanelLeftClose,
    PanelLeftOpen,
    Target,
    X,
} from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
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
    const [leftRailOpen, setLeftRailOpen] = useState(true);

    const total = lesson.steps.length;
    const step = lesson.steps[state.stepIndex];
    const outcome = step ? state.outcomes[step.id] : undefined;
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
                        <button
                            type="button"
                            className="lesson-player__rail-toggle"
                            aria-controls="lesson-step-rail"
                            aria-expanded={leftRailOpen}
                            aria-label={
                                leftRailOpen
                                    ? 'Sembunyikan alur pelajaran'
                                    : 'Tampilkan alur pelajaran'
                            }
                            onClick={() => setLeftRailOpen((open) => !open)}
                        >
                            {leftRailOpen ? (
                                <PanelLeftClose aria-hidden="true" size={18} />
                            ) : (
                                <PanelLeftOpen aria-hidden="true" size={18} />
                            )}
                        </button>
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
                        <span data-testid="player-xp">
                            XP {progress?.totalXp ?? '—'}
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
                                    —
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </header>

            <div
                className={`lesson-player__body ${
                    leftRailOpen ? '' : 'lesson-player__body--left-rail-hidden'
                }`}
            >
                <aside
                    id="lesson-step-rail"
                    className="lesson-player__rail lesson-player__rail--left"
                    aria-label="Alur pelajaran"
                    aria-hidden={!leftRailOpen}
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
                                    onClick={() => store.getState().goTo(index)}
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
                    <div className="lesson-player__context">
                        <span>
                            <BookOpen aria-hidden="true" size={16} />
                            Materi pelajaran
                        </span>
                        <span
                            className={`lesson-player__status ${
                                stepDone ? 'lesson-player__status--done' : ''
                            }`}
                        >
                            {stepDone ? 'Selesai' : 'Belum selesai'}
                        </span>
                    </div>
                    <h1 className="lesson-player__heading">
                        {step ? stepLabel(step) : lesson.title}
                    </h1>
                    <p className="lesson-player__description">
                        {lesson.description}
                    </p>

                    {error ? (
                        <div role="alert" className="lesson-player__error">
                            {error}
                        </div>
                    ) : null}

                    {step ? (
                        <div className="lesson-player__step-card">
                            <StepView
                                key={step.id}
                                step={step}
                                pending={state.pending}
                                selected={selected[step.id]}
                                onAnswer={(payload) => {
                                    void answer(payload, step);
                                }}
                                onSelect={(optionId) => {
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

                            {outcome ? (
                                <div
                                    className={`lesson-player__feedback ${
                                        outcome.correct
                                            ? 'lesson-player__feedback--correct'
                                            : 'lesson-player__feedback--wrong'
                                    }`}
                                >
                                    {outcome.feedback}
                                </div>
                            ) : null}
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

                <aside
                    className="lesson-player__rail lesson-player__rail--right"
                    aria-label="Ringkasan pelajaran"
                >
                    <section className="lesson-player__side-panel">
                        <h2>
                            <Target aria-hidden="true" size={19} />
                            Di pelajaran ini
                        </h2>
                        <ul className="lesson-player__goal-list">
                            {lesson.steps.map((item, index) => (
                                <li key={item.id}>
                                    <span aria-hidden="true">
                                        {completedSteps.has(item.id)
                                            ? '✓'
                                            : index + 1}
                                    </span>
                                    {stepLabel(item)}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className="lesson-player__side-panel lesson-player__side-panel--note">
                        <h2>
                            <HelpCircle aria-hidden="true" size={19} />
                            Ingat ini
                        </h2>
                        <p>{lesson.description}</p>
                    </section>
                </aside>
            </div>

            <footer className="lesson-player__footer">
                <div className="lesson-player__footer-inner">
                    <div className="lesson-player__footer-current">
                        <span className="lesson-player__footer-icon">
                            <BookOpen aria-hidden="true" size={21} />
                        </span>
                        <span>
                            <strong>
                                {step ? stepLabel(step) : 'Belum ada materi'}
                            </strong>
                            <small>
                                Materi {currentStepNumber} dari {total}
                            </small>
                        </span>
                    </div>
                    <div className="lesson-player__footer-actions">
                        <button
                            type="button"
                            className="lesson-player__previous"
                            disabled={state.stepIndex === 0 || state.pending}
                            onClick={() => store.getState().previous()}
                        >
                            <ArrowLeft aria-hidden="true" size={17} />
                            Sebelumnya
                        </button>
                        <Button
                            variant="primary"
                            className="lesson-player__continue"
                            data-testid="player-continue-button"
                            disabled={!canContinue}
                            onClick={() => void handleContinue()}
                        >
                            {nextLabel}
                            <ArrowRight aria-hidden="true" size={18} />
                        </Button>
                    </div>
                </div>
            </footer>
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
