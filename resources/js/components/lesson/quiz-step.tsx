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
        <div className="flex flex-col gap-5">
            {step.content.question ? (
                <h2 className="font-display text-2xl font-bold text-slate-900">
                    {step.content.question}
                </h2>
            ) : null}

            <div className="flex flex-col gap-3" role="list">
                {step.content.options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        role="listitem"
                        disabled={disabled}
                        onClick={() => onSelect(option.id)}
                        className={cn(
                            'min-h-14 rounded-2xl border-2 px-5 py-3 text-left text-base font-semibold transition-colors',
                            'focus-visible:ring-ring/50 focus-visible:ring-4 focus-visible:outline-none',
                            selectedId === option.id
                                ? 'border-primary bg-accent text-accent-foreground'
                                : 'border-border hover:border-primary/60 bg-white text-slate-700',
                            disabled && 'cursor-not-allowed opacity-70',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
