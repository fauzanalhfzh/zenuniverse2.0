import { cn } from '@/lib/utils';
import type { QuizStep } from '@/types/lesson';

export function QuizStepView({
    step,
    selectedId,
    disabled,
    onSelect,
}: {
    step: QuizStep;
    selectedId?: string;
    disabled: boolean;
    onSelect: (optionId: string) => void;
}) {
    return (
        <div className="lesson-player__quiz">
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
