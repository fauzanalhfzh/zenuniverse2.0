import { createInertiaApp } from '@inertiajs/react';
import LessonNavigationLoading from '@/components/lesson/lesson-navigation-loading';

// Explicit allowlist: never import learner editors (Blockly/Monaco) in Node.
const pages = {
    home: () => import('./pages/home'),
    price: () => import('./pages/price'),
    blog: () => import('./pages/blog'),
    'blog-article': () => import('./pages/blog-article'),
};

void createInertiaApp({
    resolve: async (name) => {
        const load = pages[name as keyof typeof pages];
        if (!load) throw new Error(`SSR is not allowed for page: ${name}`);
        return (await load()).default;
    },
    withApp: (app) => <LessonNavigationLoading>{app}</LessonNavigationLoading>,
    title: (title) => title || import.meta.env.VITE_APP_NAME || 'ZenUniverse Academy',
});
