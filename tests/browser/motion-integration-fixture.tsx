import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../resources/css/app.css';
import Dashboard from '@/pages/dashboard';
import LessonShow from '@/pages/lesson/show';
import type { CourseDetail, LessonPayload } from '@/types/lesson';

const course: CourseDetail = {
    id: 'motion-test',
    title: 'Misi uji animasi',
    description: 'Data simulasi',
    level: 'Pemula',
    accessTier: 'free',
    contentRevision: 1,
    units: [
        {
            id: 'unit',
            title: 'Unit uji',
            description: '',
            lessons: [
                {
                    id: 'quiz',
                    title: 'Latihan animasi',
                    description: '',
                    completed: false,
                    unlocked: true,
                },
            ],
        },
    ],
};
const lesson: LessonPayload = {
    id: 'quiz',
    title: 'Latihan animasi',
    description: 'Data simulasi',
    courseId: course.id,
    courseTitle: course.title,
    completed: false,
    completedStepIds: [],
    contentRevision: 1,
    completionRewardXp: 0,
    steps: [
        {
            id: 'step',
            type: 'quiz',
            reward: { xp: 10 },
            content: {
                question: 'Pilih jawaban untuk menguji feedback.',
                options: [
                    { id: 'wrong', label: 'Jawaban salah' },
                    { id: 'right', label: 'Jawaban benar' },
                ],
            },
        },
    ],
};

const isLesson = new URLSearchParams(location.search).has('lesson');
createRoot(document.getElementById('root')!).render(
    isLesson ? (
        <LessonShow lesson={lesson} />
    ) : (
        <StrictMode>
            <Dashboard active={course} />
        </StrictMode>
    ),
);
