import { Button } from '@/components/ui/button';

export function LessonCompletion({
    xpEarned,
    lessonTitle,
}: {
    xpEarned: number;
    lessonTitle: string;
}) {
    return (
        <div className="flex flex-col items-center gap-5 rounded-3xl border-4 border-yellow-200 bg-white p-8 text-center">
            <p className="text-primary text-sm font-bold tracking-[2px] uppercase">
                Pelajaran selesai
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-900">
                {lessonTitle}
            </h2>
            <p className="text-5xl font-bold text-slate-900">+{xpEarned} XP</p>
            <p className="text-slate-600">
                Kerja bagus! Lanjutkan ke pelajaran berikutnya.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <Button href="/dashboard">Kembali ke dashboard</Button>
                <Button href="/learn" variant="outline">
                    Lihat jalur belajar
                </Button>
            </div>
        </div>
    );
}
