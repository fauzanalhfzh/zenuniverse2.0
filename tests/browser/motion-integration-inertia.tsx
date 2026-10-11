import type { ComponentProps, ReactNode } from 'react';

export function usePage() {
    return { props: { auth: { user: { id: 991 } }, progressPollMs: 60_000 } };
}
export function Head() {
    return null;
}
export function Link({
    children,
    ...props
}: ComponentProps<'a'> & { children?: ReactNode }) {
    return <a {...props}>{children}</a>;
}
export const router = {
    visit() {
        throw new Error('Navigation outside isolated motion fixture');
    },
};
