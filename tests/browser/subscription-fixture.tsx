import { createRoot } from 'react-dom/client';
import '../../resources/css/app.css';
import MissionMap from '@/components/dashboard/mission-map';
import {
    SubscriptionProvider,
    useSubscription,
} from '@/lib/subscription/session';
import type { CourseDetail } from '@/types/lesson';

const course: CourseDetail = {
    id: 'subscription-fixture',
    title: 'Kursus uji Plus',
    description: 'Data sintetis untuk pengujian',
    level: 'Pemula',
    accessTier: 'plus',
    contentRevision: 1,
    units: [
        {
            id: 'unit-fixture',
            title: 'Unit uji Plus',
            description: '',
            lessons: [
                {
                    id: 'lesson-fixture',
                    title: 'Misi uji Plus',
                    description: '',
                    completed: false,
                    unlocked: true,
                },
            ],
        },
    ],
};

function Fixture() {
    const subscription = useSubscription();
    return (
        <main style={{ maxWidth: 640, margin: '0 auto' }}>
            <output data-testid="subscription-state">
                {subscription.status}:
                {subscription.plusActive ? 'plus' : 'free'}
            </output>
            <MissionMap course={course} />
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <SubscriptionProvider>
        <Fixture />
    </SubscriptionProvider>,
);
