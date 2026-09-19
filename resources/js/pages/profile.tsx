import { Head } from '@inertiajs/react';
import { ProfileView } from '@/components/profile/profile-view';
import type { ProfileProps } from '@/types/profile';

export default function Profile(props: ProfileProps) {
    return (
        <>
            <Head title="Profil | ZenUniverse" />
            <main className="mx-auto w-full max-w-3xl px-4 py-10">
                <ProfileView profile={props} />
            </main>
        </>
    );
}
