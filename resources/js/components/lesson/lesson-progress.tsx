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
        <div className="lesson-player__progress">
            <div
                className="lesson-player__progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Kemajuan pelajaran"
            >
                <div
                    className="lesson-player__progress-value"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className="lesson-player__progress-label">
                {Math.min(current + 1, total)}/{total}
            </span>
        </div>
    );
}
