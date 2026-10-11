import { Button } from '@/components/ui/button';
import { MotionAsset } from '@/components/motion/motion-asset';
import { dashboard } from '@/routes';
import { index as learnIndex } from '@/routes/learn';

export function LessonCompletion({
    xpEarned,
    lessonTitle,
    courseId,
}: {
    xpEarned: number;
    lessonTitle: string;
    courseId: string;
}) {
    return (
        <div className="flex flex-col items-center gap-5 rounded-3xl border-4 border-yellow-200 bg-white p-8 text-center">
            <MotionAsset kind="mascot" size={96} playOnMount />
            <p className="text-primary text-sm font-bold tracking-[2px] uppercase">
                Pelajaran selesai
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-900">
                {lessonTitle}
            </h2>
            <p className="flex items-center gap-3 text-5xl font-bold text-slate-900">
                <MotionAsset kind="star" size={48} playOnMount />+{xpEarned} XP
            </p>
            <p className="text-slate-600">
                Kerja bagus! Lanjutkan ke pelajaran berikutnya.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <Button href={dashboard.url({ query: { course: courseId } })}>
                    Kembali ke modul
                </Button>
                <Button href={learnIndex.url()} variant="outline">
                    Lihat jalur belajar
                </Button>
            </div>
        </div>
    );
}
