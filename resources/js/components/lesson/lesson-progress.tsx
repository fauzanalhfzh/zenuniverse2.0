import { stepProgress } from '@/stores/lesson-store';

export function LessonProgress({
    current,
    total,
}: {
    current: number;
    total: number;
}) {
    const percent = stepProgress(current, total);

    return (
        <div className="flex items-center gap-3">
            <div
                className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Kemajuan pelajaran"
            >
                <div
                    className="bg-primary h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className="text-sm font-bold text-slate-500">
                {Math.min(current + 1, total)}/{total}
            </span>
        </div>
    );
}
