import { cn } from '@/lib/utils';
import { FileCode2 } from 'lucide-react';
import { quizPresentation } from '@/lib/lesson/quiz-presentation';
import type { QuizStep } from '@/types/lesson';

export function QuizStepView({
    step,
    selectedId,
    disabled,
    onSelect,
    language,
}: {
    step: QuizStep;
    selectedId?: string;
    disabled: boolean;
    onSelect: (optionId: string) => void;
    language?: string;
}) {
    const { code } = quizPresentation(
        step.content.question,
        step.content.language ?? language,
        step.content.code,
    );
    return (
        <div className="lesson-player__quiz">
            {code ? (
                <section
                    className="lesson-player__code-fill-editor"
                    aria-label="Potongan kode Python, hanya baca"
                >
                    <div className="lesson-player__code-fill-filebar">
                        <span className="lesson-player__code-fill-file">
                            <FileCode2 size={16} aria-hidden="true" />
                            soal.py
                        </span>
                        <span className="lesson-player__code-fill-count">
                            Hanya baca
                        </span>
                    </div>
                    <pre className="lesson-player__code-fill-code" tabIndex={0}>
                        <code>
                            {code.split('\n').map((line, index) => (
                                <span
                                    className="lesson-player__code-fill-line"
                                    key={index}
                                >
                                    <span
                                        className="lesson-player__code-fill-number"
                                        aria-hidden="true"
                                    >
                                        {index + 1}
                                    </span>
                                    <span>
                                        {line}
                                        {index < code.split('\n').length - 1
                                            ? '\n'
                                            : ''}
                                    </span>
                                </span>
                            ))}
                        </code>
                    </pre>
                </section>
            ) : null}
            <div className="lesson-player__quiz-options" role="list">
                {step.content.options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        role="listitem"
                        disabled={disabled}
                        onClick={() => onSelect(option.id)}
                        className={cn(
                            'lesson-player__quiz-option',
                            selectedId === option.id &&
                                'lesson-player__quiz-option--selected',
                            disabled && 'lesson-player__quiz-option--disabled',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
