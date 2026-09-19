import { Head } from '@inertiajs/react';
import { LessonPlayer } from '@/components/lesson/lesson-player';
import { ProgressSessionProvider } from '@/lib/progress/session';
import type { LessonPayload } from '@/types/lesson';

export default function LessonShow({ lesson }: { lesson: LessonPayload }) {
    return (
        <>
            <Head title={`${lesson.title} | ZenUniverse`} />
            <ProgressSessionProvider>
                <LessonPlayer lesson={lesson} />
            </ProgressSessionProvider>
        </>
    );
}
