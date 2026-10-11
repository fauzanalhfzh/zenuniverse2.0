import { Head } from '@inertiajs/react';
import { LessonPlayer } from '@/components/lesson/lesson-player';
import { ProgressSessionProvider } from '@/lib/progress/session';
import { SubscriptionProvider } from '@/lib/subscription/session';
import type { LessonPayload } from '@/types/lesson';

export default function LessonShow({ lesson }: { lesson: LessonPayload }) {
    return (
        <>
            <Head title={`${lesson.title} | ZenUniverse`} />
            <SubscriptionProvider>
                <ProgressSessionProvider>
                    <LessonPlayer lesson={lesson} />
                </ProgressSessionProvider>
            </SubscriptionProvider>
        </>
    );
}
