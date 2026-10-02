import { createInertiaApp } from '@inertiajs/react';
import LessonNavigationLoading from '@/components/lesson/lesson-navigation-loading';

const appName = import.meta.env.VITE_APP_NAME;

void createInertiaApp({
    withApp: (app) => <LessonNavigationLoading>{app}</LessonNavigationLoading>,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
});
