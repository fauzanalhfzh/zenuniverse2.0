import type { ComponentProps } from 'react';

export function usePage() {
    return { props: { auth: { user: { id: 1 } } } };
}

export function Link(props: ComponentProps<'a'>) {
    return <a {...props} />;
}

export const router = {
    visit() {
        throw new Error('Lesson navigation outside subscription fixture scope');
    },
};
