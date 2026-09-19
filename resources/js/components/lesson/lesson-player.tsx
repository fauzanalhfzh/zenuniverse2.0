import { Link } from '@inertiajs/react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { CodeArrangeStepView } from '@/components/lesson/code-arrange-step';
import { CodeFillStepView } from '@/components/lesson/code-fill-step';
import { ConceptStepView } from '@/components/lesson/concept-step';
import { LessonCompletion } from '@/components/lesson/lesson-completion';
import { LessonProgress } from '@/components/lesson/lesson-progress';
import { QuizStepView } from '@/components/lesson/quiz-step';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/progress/client';
import { useProgressSession } from '@/lib/progress/session';
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

    const total = lesson.steps.length;
    const step = lesson.steps[state.stepIndex];
    const outcome = step ? state.outcomes[step.id] : undefined;

    const completedSteps = new Set(lesson.completedStepIds);
    for (const [stepId, stepOutcome] of Object.entries(state.outcomes)) {
        if (stepOutcome.correct) {
            completedSteps.add(stepId);
        }
    }

    async function answer(payload: StepAnswer) {
        if (!step) {
            return;
        }

        setError(null);
        store.getState().setPending(true);

        try {
            const result = await submit({
                lesson_id: lesson.id,
                step_id: step.id,
                attempt_id: crypto.randomUUID(),
                content_revision: lesson.contentRevision,
                answer: payload,
            });

            store.getState().recordOutcome(step.id, {
                correct: result.result.correct,
                feedback: result.result.feedback,
                consumeHeart: result.result.consumeHeart,
                xpAwarded: result.xpAwarded,
            });
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? caught.message
                    : 'Koneksi bermasalah. Coba lagi.',
            );
        } finally {
            store.getState().setPending(false);
        }
    }

    async function handleContinue() {
        const allCorrect = lesson.steps.every(
            (item) =>
                store.getState().outcomes[item.id]?.correct ||
                lesson.completedStepIds.includes(item.id),
        );

        if (state.stepIndex < total - 1) {
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
            <div className="mx-auto w-full max-w-3xl px-4 py-10">
                <LessonCompletion
                    xpEarned={state.xpEarned}
                    lessonTitle={lesson.title}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={`/dashboard?course=${lesson.courseId}`}
                    className="text-primary text-sm font-bold"
                >
                    ← {lesson.courseTitle}
                </Link>
                <span className="text-sm font-bold text-slate-500">
                    ❤️ {progress?.hearts ?? '—'}
                </span>
            </div>

            <h1 className="font-display text-3xl font-bold text-slate-900">
                {lesson.title}
            </h1>

            <LessonProgress current={state.stepIndex} total={total} />

            {error ? (
                <div
                    role="alert"
                    className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900"
                >
                    {error}
                </div>
            ) : null}

            {step ? (
                <div className="border-border rounded-3xl border-2 bg-white p-5 sm:p-7">
                    <StepView
                        step={step}
                        pending={state.pending}
                        selected={selected[step.id]}
                        onAnswer={answer}
                        onSelect={(optionId) => {
                            setSelected((current) => ({
                                ...current,
                                [step.id]: optionId,
                            }));
                            void answer({ type: 'quiz', optionId });
                        }}
                    />

                    {outcome ? (
                        <div
                            className={`mt-5 rounded-2xl border-2 p-4 text-sm font-semibold ${
                                outcome.correct
                                    ? 'border-green-200 bg-green-50 text-green-900'
                                    : 'border-amber-200 bg-amber-50 text-amber-900'
                            }`}
                        >
                            {outcome.feedback}
                        </div>
                    ) : null}

                    {outcome?.correct ? (
                        <div className="mt-5">
                            <Button
                                onClick={() => void handleContinue()}
                                disabled={state.pending}
                            >
                                {state.stepIndex < total - 1
                                    ? 'Lanjut'
                                    : 'Selesaikan pelajaran'}
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {state.stepIndex > 0 ? (
                <button
                    type="button"
                    className="self-start text-sm font-bold text-slate-500 hover:text-slate-800"
                    onClick={() => store.getState().previous()}
                >
                    ← Langkah sebelumnya
                </button>
            ) : null}
        </div>
    );
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
            return (
                <ConceptStepView
                    step={step}
                    pending={pending}
                    onAcknowledge={() =>
                        onAnswer({ type: 'concept', acknowledged: true })
                    }
                />
            );
        case 'quiz':
            return (
                <QuizStepView
                    step={step}
                    selectedId={selected}
                    disabled={pending}
                    onSelect={onSelect}
                />
            );
        case 'code-arrange':
            return (
                <CodeArrangeStepView
                    step={step}
                    pending={pending}
                    onSubmit={(tokenIds) =>
                        onAnswer({ type: 'code-arrange', tokenIds })
                    }
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
